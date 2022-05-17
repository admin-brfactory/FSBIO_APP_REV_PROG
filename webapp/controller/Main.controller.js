sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/export/Spreadsheet",
	'sap/ui/export/library',
	"com/fsBioenergiaZ_REV_PROG/model/formatter",
	"sap/m/MessageToast"
], function(Controller, JSONModel, MessageBox, Spreadsheet, exportLibrary, formatter, MessageToast) {
	"use strict";

	var EdmType = exportLibrary.EdmType;

	return Controller.extend("com.fsBioenergiaZ_REV_PROG.controller.Main", {

		formatter: formatter,

		onInit: function() {
			var oView1 = new JSONModel({

				Relatorio: {
					"catalog": {
						"relatorio": {}

					}
				},

				Produtos: {
					"catalog": {
						"produtos": {}
					}
				},
				
				dadosProgCount: 0,
				dadosProg: [],
				dadosProgForCompare: [],
				dadosProgExport: [],
				listaPlantas: [],
				listaVendedores: [],
				listProdutos: [],
				listCaminhoes: [],
				listIncoterm: [],
				tabRelatUF: [],
				tabRelatUFCount: 0,
				tabRelatUFExport: [],
				excelData: [],
				listaErros: [],
				tipoUsuario: ""

			});

			this.getView().setModel(oView1, "revisaoView");
			this.onSearchProg();
		},

		onClickSearchProg: function() {
			var oViewModel = this.getView().getModel("revisaoView");
			var screenTabProg = this.setCheckBoxValueToTab();
			var systemTabProg = oViewModel.getProperty("/dadosProgForCompare");
			screenTabProg = JSON.stringify(screenTabProg);
			systemTabProg = JSON.stringify(systemTabProg);

			if (screenTabProg !== systemTabProg) {
				MessageBox.confirm("Os dados não salvos serão perdidos deseja continuar?", {
					onClose: function(oAction) {
						if (oAction == "OK") {
							this.onSearchProg();
						} else {
							return;
						};
					}.bind(this)
				});
			} else {
				this.onSearchProg();
			};
		},

		onSearchProg: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("revisaoView");
			var usuario = sap.ushell.Container.getService("UserInfo").getId();
			var planta = this.getView().byId("filtroPlanta").getSelectedKey();
			var vendedor = this.getView().byId("filtroVendedor").getSelectedKey();
			var dataIni = this.getView().byId("dataIni").getDateValue();
			var dataFim = this.getView().byId("dataFim").getDateValue();
			var Dates = this.validaData(dataIni, dataFim);

			if (Dates == "Error") {
				return;
			};

			dataIni = Dates[0];
			dataFim = Dates[1];

			var sURL = "/GET_DADOS_PROGSet(PLANTA='" + planta + "',VENDEDOR='" + vendedor + "',DATA_INI='" + dataIni + "',DATA_FIM='" + dataFim +
				"',USUARIO='" + usuario + "')";

			sap.ui.core.BusyIndicator.show();
			oModel.read(sURL, {
				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();
					if (oData.TAB_RESUMO) {
						oData.TAB_RESUMO = oData.TAB_RESUMO.replaceAll("CATEGORIES", "categories");
						oData.TAB_RESUMO = oData.TAB_RESUMO.replaceAll("NAME", "name");

						var oTabResumo = JSON.parse(oData.TAB_RESUMO);

						oViewModel.setProperty("/Produtos/catalog/produtos", oTabResumo);
					}

					if (oData.TAB_PROGS != "[]") {
						var tabProg = JSON.parse(oData.TAB_PROGS);
						var tabProgForCompare = JSON.parse(oData.TAB_PROGS);
						var tabProgExport = JSON.parse(oData.TAB_PROGS);
						oViewModel.setProperty("/dadosProg", tabProg);
						oViewModel.setProperty("/dadosProgForCompare", tabProgForCompare);
						oViewModel.setProperty("/dadosProgExport", tabProgExport);
						oViewModel.setProperty("/dadosProgCount", tabProg.length);
						this.trataDadosExport("/dadosProgExport");
					}

					if (oData.LIST_PLANTAS != "[]") {
						var listaPlantas = JSON.parse(oData.LIST_PLANTAS);
						listaPlantas.unshift({
							KEY: "",
							PLANTA: ""
						})
						oViewModel.setProperty("/listaPlantas", listaPlantas);
					}

					if (oData.LIST_VENDEDORES != "[]") {
						var listaVendedores = JSON.parse(oData.LIST_VENDEDORES);
						listaVendedores.unshift({
							KEY: "",
							VENDEDOR: ""
						})
						oViewModel.setProperty("/listaVendedores", listaVendedores);
					}

					if (oData.TIPO_USUARIO != "") {
						oViewModel.setProperty("/tipoUsuario", oData.TIPO_USUARIO);
						this.validaTipoUsuário();
					};

					oViewModel.refresh(true);
				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();

				}.bind(this)
			});
		},

		onBuscarRelatMens: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("revisaoView");
			var dataIni = this.getView().byId("dataIni").getDateValue();
			var dataFim = this.getView().byId("dataFim").getDateValue();
			var Dates = this.validaData(dataIni, dataFim);

			if (Dates == "Error") {
				return;
			};

			dataIni = Dates[0];
			dataFim = Dates[1];

			var sURL = "/GET_RELAT_MENSSet(DATA_INI='" + dataIni + "',DATA_FIM='" + dataFim + "')";

			sap.ui.core.BusyIndicator.show();
			oModel.read(sURL, {
				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();
					oData.TAB_RELAT_MENSAL = oData.TAB_RELAT_MENSAL.replaceAll("CATEGORIES", "categories");
					oData.TAB_RELAT_MENSAL = oData.TAB_RELAT_MENSAL.replaceAll("NAME", "name");
					var oTreeTab = JSON.parse(oData.TAB_RELAT_MENSAL);

					for (var index in oTreeTab) {
						var auxArray = [];
						var cat = [];
						var Categories_aux = oTreeTab[index].categories;
						var categories = JSON.parse(Categories_aux);

						for (var i in categories) {
							var aux = JSON.parse(categories[i].STRING_FIELD);
							auxArray.push(aux);
						};

						for (var j in auxArray) {
							for (var k in auxArray[j]) {
								cat.push(auxArray[j][k]);
							};
						};

						oTreeTab[index].categories = cat;
					}
					oViewModel.setProperty("/Relatorio/catalog/relatorio/categories", oTreeTab)

					this._onRelatSemanAcumulado();

				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();

				}.bind(this)
			});

		},

		onBuscarRelatSem: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("revisaoView");
			var dataIni = this.getView().byId("dataIni").getDateValue();
			var dataFim = this.getView().byId("dataFim").getDateValue();
			var Dates = this.validaData(dataIni, dataFim);

			if (Dates == "Error") {
				return;
			};

			dataIni = Dates[0];
			dataFim = Dates[1];

			var sURL = "/GET_RELAT_SEMANSet(DATA_INI='" + dataIni + "',DATA_FIM='" + dataFim + "')";

			sap.ui.core.BusyIndicator.show();
			oModel.read(sURL, {
				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();
					oData.TAB_RELAT_SEMANAL = oData.TAB_RELAT_SEMANAL.replaceAll("CATEGORIES", "categories");
					oData.TAB_RELAT_SEMANAL = oData.TAB_RELAT_SEMANAL.replaceAll("NAME", "name");
					var oTreeTab = JSON.parse(oData.TAB_RELAT_SEMANAL);

					for (var index in oTreeTab) {
						var auxArray = [];
						var cat = [];
						var Categories_aux = oTreeTab[index].categories;
						var categories = JSON.parse(Categories_aux);

						for (var i in categories) {
							var aux = JSON.parse(categories[i].STRING_FIELD);
							auxArray.push(aux);
						};

						for (var j in auxArray) {
							for (var k in auxArray[j]) {
								cat.push(auxArray[j][k]);
							};
						};

						oTreeTab[index].categories = cat;
					}
					oViewModel.setProperty("/Relatorio/catalog/relatorio/categories", oTreeTab);

					this._onRelatSemanAcumulado();

				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();

				}.bind(this)
			});
		},

		onBuscarRelatUF: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("revisaoView");
			var usuario = sap.ushell.Container.getService("UserInfo").getId();
			var produto = this.getView().byId("relatUFProduto");
			var caminhao = this.getView().byId("relatUFCaminhao");
			var planta = this.getView().byId("relatUFPlanta");
			var incoterm = this.getView().byId("relatUFIncoterm");
			var dataIni = this.getView().byId("dataIni").getDateValue();
			var dataFim = this.getView().byId("dataFim").getDateValue();
			var Dates = this.validaData(dataIni, dataFim);
			if (Dates == "Error") {
				return;
			};

			dataIni = Dates[0];
			dataFim = Dates[1];

			if (typeof(produto) != "undefined" && typeof(caminhao) != "undefined" && typeof(planta) != "undefined" && typeof(incoterm) !=
				"undefined") {
				produto = produto.getSelectedKey();
				caminhao = caminhao.getSelectedKey();
				planta = planta.getSelectedKey();
				incoterm = incoterm.getSelectedKey();
			} else {
				produto = "";
				caminhao = "";
				planta = "";
				incoterm = "";
			};

			var sURL = "/GET_RELAT_UFSet(USUARIO='" + usuario + "',CAMINHAO='" + caminhao + "',PRODUTO='" + produto + "',PLANTA='" + planta +
				"',INCOTERM='" + incoterm + "',DATA_INI='" + dataIni + "',DATA_FIM='" + dataFim + "')";

			sap.ui.core.BusyIndicator.show();
			oModel.read(sURL, {
				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();

					if (oData.LIST_CAMINHAO) {
						var oListCaminhao = JSON.parse(oData.LIST_CAMINHAO);
						oListCaminhao.unshift({
							KEY: "",
							DESC_CAMINHAO: ""
						});
						oViewModel.setProperty("/listCaminhoes", oListCaminhao);
					};

					if (oData.LIST_PRODUTOS) {
						var oListProdutos = JSON.parse(oData.LIST_PRODUTOS);
						oListProdutos.unshift({
							KEY: "",
							DESC_PRODUTO: ""
						});
						oViewModel.setProperty("/listProdutos", oListProdutos);
					};

					if (oData.LIST_INCOTERM) {
						var oListIncoterm = JSON.parse(oData.LIST_INCOTERM);
						oListIncoterm.unshift({
							KEY: "",
							DESC_INCOTERM: ""
						});
						oViewModel.setProperty("/listIncoterm", oListIncoterm);
					};

					if (oData.TAB_RES_UF) {
						var oTabUF = JSON.parse(oData.TAB_RES_UF);
						var oTabUFExport = JSON.parse(oData.TAB_RES_UF);
						oViewModel.setProperty("/tabRelatUF", oTabUF);
						oViewModel.setProperty("/tabRelatUFExport", oTabUFExport);
						oViewModel.setProperty("/tabRelatUFCount", oTabUF.length);
						this.trataDadosExport("/tabRelatUFExport");
					};
					this.onRelatUF();

				}.bind(this),
				error: function(oError) {
					sap.ui.core.BusyIndicator.hide();

				}.bind(this)
			});

		},

		validaData: function(sDataIni, sDataFim) {
			var aData = [];

			if (sDataIni == null) {
				sDataIni = "";
			}

			if (sDataFim == null) {
				sDataFim = "";
			}

			if (sDataIni != "" && sDataFim == "") {
				MessageBox.error("Não pode haver uma data inicial sem uma data final");
				return "Error";
			} else if (sDataFim != "" && sDataIni == "") {
				MessageBox.error("Não pode haver uma data final sem uma data inicial");
				return "Error";
			} else if (sDataIni == "" && sDataFim == "") {
				aData.push(sDataIni);
				aData.push(sDataFim);
				return aData;
			} else if (sDataIni > sDataFim) {
				MessageBox.error("A data incial não pode ser maior que a data final.");
				return "Error";
			} else {
				sDataIni = sDataIni.toLocaleDateString();
				sDataFim = sDataFim.toLocaleDateString();

				sDataIni = sDataIni.substr(6) + sDataIni.substr(3, 2) + sDataIni.substr(0, 2);
				sDataFim = sDataFim.substr(6) + sDataFim.substr(3, 2) + sDataFim.substr(0, 2);
			};

			aData.push(sDataIni);
			aData.push(sDataFim);

			return aData;

		},

		validaTipoUsuário: function() { // Desabilita os checkBox não referentes ao tipo de usuário logado, e também o botão de relatório por UF caso o usuário não seja do tipo logística
			var oTableRows = this.getView().byId("ProgTable").getRows();
			var checkBoxPlanej = this.getView().byId("aprvPlanej");
			var checkBoxComer = this.getView().byId("aprvComer");
			var checkBoxLogist = this.getView().byId("aprvlogist");
			var btnRelatUF = this.getView().byId("relatorioUF");
			var tipoUsuario = this.getView().getModel("revisaoView").getProperty("/tipoUsuario");

			switch (tipoUsuario) {
				case "PLANEJAMENTO":
					for (let index in oTableRows) {
						checkBoxPlanej.setEnabled(true);
						checkBoxComer.setEnabled(false);
						checkBoxLogist.setEnabled(false);
						oTableRows[index].getCells()[13].setEnabled(true);
						oTableRows[index].getCells()[14].setEnabled(false);
						oTableRows[index].getCells()[15].setEnabled(false);
						btnRelatUF.setVisible(false);
					}
					break;
				case "COMERCIAL":
					for (let index in oTableRows) {
						checkBoxPlanej.setEnabled(false);
						checkBoxComer.setEnabled(true);
						checkBoxLogist.setEnabled(false);
						oTableRows[index].getCells()[13].setEnabled(false);
						oTableRows[index].getCells()[14].setEnabled(true);
						oTableRows[index].getCells()[15].setEnabled(false);
						btnRelatUF.setVisible(false);
					}
					break;
				case "LOGISTICA":
					for (let index in oTableRows) {
						checkBoxPlanej.setEnabled(false);
						checkBoxComer.setEnabled(false);
						checkBoxLogist.setEnabled(true);
						oTableRows[index].getCells()[13].setEnabled(false);
						oTableRows[index].getCells()[14].setEnabled(false);
						oTableRows[index].getCells()[15].setEnabled(true);
						btnRelatUF.setVisible(true);
					}
					break;
			}
		},

		checaNumerico: function() { //Verifica e apenas permite que o valor do campo seja numérico.
			var regExp = /[a-zA-Z]/g;
			var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?°¨¨ºª₢£¢¬§`~´çÇ]+/;
			var oTableRows = this.getView().byId("ProgTable").getRows()

			for (let index in oTableRows) {
				var sValue = oTableRows[index].getCells()[10].getValue();
				if (regExp.test(sValue) || format.test(sValue)) {
					oTableRows[index].getCells()[10].setValue(sValue.substring(0, sValue.length - 1));
				}
			}

		},

		onClickAprovarTodos: function(sID) { // Quando clica no checkBox da coluna marca todos os itens habilitados para aprovação e desebilita a rejeição dos mesmo itens.
			var oTableRows = this.getView().byId("ProgTable").getRows();
			var isSelected, index;

			if (sID == "aprvPlanej") {
				isSelected = this.getView().byId(sID).getSelected();

				if (isSelected == true) {
					for (index in oTableRows) {
						if (oTableRows[index].getCells()[13].getAggregation("content")[0].getAggregation("content")[1].getEnabled() == true) {
							oTableRows[index].getCells()[13].getAggregation("content")[0].getAggregation("content")[1].setSelected(true);
							oTableRows[index].getCells()[13].getAggregation("content")[1].getAggregation("content")[1].setEnabled(false); // Desabilita rejeição
						};
					}

				} else {
					for (index in oTableRows) {
						if (oTableRows[index].getCells()[13].getAggregation("content")[0].getAggregation("content")[1].getEnabled() == true) {
							oTableRows[index].getCells()[13].getAggregation("content")[0].getAggregation("content")[1].setSelected(false);
							oTableRows[index].getCells()[13].getAggregation("content")[1].getAggregation("content")[1].setEnabled(true); // Desabilita rejeição
						};
					}

				}

			} else if (sID == "aprvComer") {
				isSelected = this.getView().byId(sID).getSelected();

				if (isSelected == true) {
					for (index in oTableRows) {
						if (oTableRows[index].getCells()[14].getAggregation("content")[0].getAggregation("content")[1].getEnabled() == true) {
							oTableRows[index].getCells()[14].getAggregation("content")[0].getAggregation("content")[1].setSelected(true);
							oTableRows[index].getCells()[14].getAggregation("content")[1].getAggregation("content")[1].setEnabled(false); // Desabilita rejeição
						};
					};

				} else {
					for (index in oTableRows) {
						if (oTableRows[index].getCells()[14].getAggregation("content")[0].getAggregation("content")[1].getEnabled() == true) {
							oTableRows[index].getCells()[14].getAggregation("content")[0].getAggregation("content")[1].setSelected(false);
							oTableRows[index].getCells()[14].getAggregation("content")[1].getAggregation("content")[1].setEnabled(true); // Desabilita rejeição
						};
					};

				}
			} else if (sID == "aprvlogist") {
				isSelected = this.getView().byId(sID).getSelected();

				if (isSelected == true) {
					for (index in oTableRows) {
						if (oTableRows[index].getCells()[15].getAggregation("content")[0].getAggregation("content")[1].getEnabled() == true) {
							oTableRows[index].getCells()[15].getAggregation("content")[0].getAggregation("content")[1].setSelected(true);
							oTableRows[index].getCells()[15].getAggregation("content")[1].getAggregation("content")[1].setEnabled(false); // Desabilita rejeição
						};
					};

				} else {
					for (index in oTableRows) {
						if (oTableRows[index].getCells()[15].getAggregation("content")[0].getAggregation("content")[1].getEnabled() == true) {
							oTableRows[index].getCells()[15].getAggregation("content")[0].getAggregation("content")[1].setSelected(false);
							oTableRows[index].getCells()[15].getAggregation("content")[1].getAggregation("content")[1].setEnabled(true); // Desabilita rejeição
						};
					};

				}
			}

		},

		validaCheckBoxAprRej: function() { // Valida se o campo veio marcado aprovar ou rejeitar, e habilita e desabilita tais campos de acordo com o que está marcado
			var oTableRows = this.getView().byId("ProgTable").getRows();
			var isSelected, index;
			var tipoUsuario = this.getView().getModel("revisaoView").getProperty("/tipoUsuario");

			switch (tipoUsuario) {
				case "PLANEJAMENTO":
					for (index in oTableRows) {
						var oRowCheckBoxAprovar = oTableRows[index].getCells()[13].getAggregation("content")[0].getAggregation("content")[1];
						var oRowCheckBoxRejeitar = oTableRows[index].getCells()[13].getAggregation("content")[1].getAggregation("content")[1];
						if (oRowCheckBoxAprovar.getSelected() == true) {
							oRowCheckBoxRejeitar.setEnabled(false);
						} else if (oRowCheckBoxRejeitar.getSelected() == true) {
							oRowCheckBoxAprovar.setEnabled(false);
						} else {
							oRowCheckBoxRejeitar.setEnabled(true);
							oRowCheckBoxAprovar.setEnabled(true);
						}
					};
					break;
				case "COMERCIAL":
					for (index in oTableRows) {
						var oRowCheckBoxAprovar = oTableRows[index].getCells()[14].getAggregation("content")[0].getAggregation("content")[1];
						var oRowCheckBoxRejeitar = oTableRows[index].getCells()[14].getAggregation("content")[1].getAggregation("content")[1];
						if (oRowCheckBoxAprovar.getSelected() == true) {
							oRowCheckBoxRejeitar.setEnabled(false);
						} else if (oRowCheckBoxRejeitar.getSelected() == true) {
							oRowCheckBoxAprovar.setEnabled(false);
						} else {
							oRowCheckBoxRejeitar.setEnabled(true);
							oRowCheckBoxAprovar.setEnabled(true);
						}
					};
					break;
				case "LOGISTICA":
					for (index in oTableRows) {
						var oRowCheckBoxAprovar = oTableRows[index].getCells()[15].getAggregation("content")[0].getAggregation("content")[1];
						var oRowCheckBoxRejeitar = oTableRows[index].getCells()[15].getAggregation("content")[1].getAggregation("content")[1];
						if (oRowCheckBoxAprovar.getSelected() == true) {
							oRowCheckBoxRejeitar.setEnabled(false);
						} else if (oRowCheckBoxRejeitar.getSelected() == true) {
							oRowCheckBoxAprovar.setEnabled(false);
						} else {
							oRowCheckBoxRejeitar.setEnabled(true);
							oRowCheckBoxAprovar.setEnabled(true);
						}
					};
					break;
			}
		},

		onSelectSingleCheckBox: function(oEvent) { // Valida em liveChange qual o checkBox o usuário marcou, aprovar ou rejeitar, e habilita e desabilita tais campos de acordo com o que foi marcado
			var source = oEvent.getSource();
			var sourcePath = oEvent.getSource().getBindingInfo("selected").binding.getPath()
			sourcePath = sourcePath.split("_");
			sourcePath = sourcePath[0];
			switch (sourcePath) {
				case "APR":
					if (source.getSelected() == true) {
						oEvent.getSource().getParent().getParent().getAggregation("content")[1].getAggregation("content")[1].setEnabled(false);
					} else {
						oEvent.getSource().getParent().getParent().getAggregation("content")[1].getAggregation("content")[1].setEnabled(true);
					};
					break;
				case "RJ":
					if (source.getSelected() == true) {
						oEvent.getSource().getParent().getParent().getAggregation("content")[0].getAggregation("content")[1].setEnabled(false);
					} else {
						oEvent.getSource().getParent().getParent().getAggregation("content")[0].getAggregation("content")[1].setEnabled(true);
					};
					break;
			}
		},

		onPressExpdColps: function(sAction, sID) {
			var oTable = this.getView().byId(sID);
			var aIndices = [];

			if (sAction == "EXPANDIR") {
				for (var i in oTable.getBinding()._aRowIndexMap) {
					aIndices.push(parseInt(i));
				}

				oTable.expand(aIndices);

			} else if (sAction == "COLAPSAR") {
				oTable.collapseAll();
			}

		},

		onConfirmTroca: function() {
			MessageBox.confirm("Os dados de programação serão alterados, deseja confirmar troca?", {
				onClose: function(oAction) {
					if (oAction == "OK") {
						this.enviarTroca();
						this._openDialogUpload().close();
						this.onPrevExcelDataCancel();
					}
				}.bind(this)
			});
		},

		trataDadosTroca: function() {
			var oViewModel = this.getView().getModel("revisaoView");
			var excelData = oViewModel.getProperty("/excelData");

			for (var index in excelData) {
				excelData[index].DATA = formatter.formatDateToABAP(excelData[index].DATA);
			};

			return excelData;
		},

		enviarTroca: function() {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("revisaoView");
			var usuario = sap.ushell.Container.getService("UserInfo").getId();
			var excelData = this.trataDadosTroca();

			var oEntry = {
				USUARIO: usuario,
				DADOS_TROCA: JSON.stringify(excelData)
			};
			
			sap.ui.core.BusyIndicator.show();
			oModel.create("/TROCAR_PROGSet", oEntry, {

				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();

					if (oData.TAB_MENSAGEM) {
						var oMensagem = JSON.parse(oData.TAB_MENSAGEM);
						var oListErro = [];
						for (var index in oMensagem) {
							if (oMensagem[index].TYPE == "S") {
								MessageBox.success(oMensagem[index].MESSAGE);
							} else {
								oListErro.push(oMensagem[index]);
							}
						}

						if (oListErro.length != 0) {
							oViewModel.setProperty("/listaErros", oListErro);
							this._openListaErros().open();
						}

					};

				}.bind(this),

				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Ocorreu um erro inesperado ao salvar os dados, tente novamente.");
				}.bind(this)

			});
		},

		setCheckBoxValueToTab: function() { // Registra do array de objeto que corresponde a tabela de programação os valores do checkBox, se estão marcados ou não
			var oViewModel = this.getView().getModel("revisaoView");
			var tipoUsuário = oViewModel.getProperty("/tipoUsuario");
			var oDadosProg = oViewModel.getProperty("/dadosProg");
			var oTable = this.getView().byId("ProgTable");
			var oTableRows = oTable.getRows();
			var index = 0;
			var selected;

			if (tipoUsuário == "PLANEJAMENTO") {
				for (index in oTableRows) {
					selected = oTableRows[index].getCells()[13].getAggregation("content")[0].getAggregation("content")[1].getSelected(); // Valor do Check Box Aprovar
					if (index < oDadosProg.length) {
						if (selected == true) {
							oDadosProg[index].APR_PLANEJAMENTO = "X";
						} else {
							oDadosProg[index].APR_PLANEJAMENTO = "";
						};

						selected = oTableRows[index].getCells()[13].getAggregation("content")[1].getAggregation("content")[1].getSelected(); //Valor do Check Box Rejeitar
						if (selected == true) {
							oDadosProg[index].RJ_PLANEJAMENTO = "X";
						} else {
							oDadosProg[index].RJ_PLANEJAMENTO = "";
						};

					};
				};

			} else if (tipoUsuário == "COMERCIAL") {
				for (index in oTableRows) {
					selected = oTableRows[index].getCells()[14].getAggregation("content")[0].getAggregation("content")[1].getSelected(); // Valor do Check Box Aprovar
					if (index < oDadosProg.length) {
						if (selected == true) {
							oDadosProg[index].APR_COMERCIAL = "X";
						} else {
							oDadosProg[index].APR_COMERCIAL = "";
						};

						selected = oTableRows[index].getCells()[14].getAggregation("content")[1].getAggregation("content")[1].getSelected(); //Valor do Check Box Rejeitar
						if (selected == true) {
							oDadosProg[index].RJ_COMERCIAL = "X";
						} else {
							oDadosProg[index].RJ_COMERCIAL = "";
						};

					};
				};

			} else if (tipoUsuário == "LOGISTICA") {
				for (index in oTableRows) {
					selected = oTableRows[index].getCells()[15].getAggregation("content")[0].getAggregation("content")[1].getSelected(); // Valor do Check Box Aprovar
					if (index < oDadosProg.length) {
						if (selected == true) {
							oDadosProg[index].APR_LOGISTICA = "X";
						} else {
							oDadosProg[index].APR_LOGISTICA = "";
						};

						selected = oTableRows[index].getCells()[15].getAggregation("content")[1].getAggregation("content")[1].getSelected(); //Valor do Check Box Rejeitar
						if (selected == true) {
							oDadosProg[index].RJ_LOGISTICA = "X";
						} else {
							oDadosProg[index].RJ_LOGISTICA = "";
						};
					};

				};
			};
			return oDadosProg;
		},

		onGravarDadosProg: function() {
			var oDadosProg;

			MessageBox.confirm("Deseja gravar programação?", {
				onClose: function(sAction) {
					if (sAction === "OK") {
						oDadosProg = this.setCheckBoxValueToTab();
						this.gravarDadosProg(oDadosProg);
					};
				}.bind(this)
			});
		},

		gravarDadosProg: function(sDadosProg) {
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getView().getModel("revisaoView");
			var usuario = sap.ushell.Container.getService("UserInfo").getId();

			var oEntry = {
				USUARIO: usuario,
				TAB_DADOS_PROG: JSON.stringify(sDadosProg)
			};

			sap.ui.core.BusyIndicator.show();
			oModel.create("/GRAVAR_DADOSSet", oEntry, {

				success: function(oData) {
					sap.ui.core.BusyIndicator.hide();

					if (oData.TAB_MENSAGEM) {
						var oMensagem = JSON.parse(oData.TAB_MENSAGEM);
						var oListErro = [];
						for (var index in oMensagem) {
							if (oMensagem[index].TYPE == "S") {
								MessageBox.success(oMensagem[index].MESSAGE, {
									onClose: function(sAction) {
										this.onSearchProg();
									}.bind(this)
								});
							} else {
								oListErro.push(oMensagem[index]);
							}
						}

						if (oListErro.length != 0) {
							oViewModel.setProperty("/listaErros", oListErro);
							this._openListaErros().open();
						}
					};

				}.bind(this),

				error: function(error) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error("Ocorreu um erro inesperado ao salvar os dados, tente novamente.");
				}.bind(this)

			});
		},

		onCloseDialog: function(sID) {
			this.getView().byId(sID).close();
		},

		_openListaErros: function() {
			if (!this.openListaErro) {
				this.openListaErro = sap.ui.xmlfragment(this.getView().getId(), "com.fsBioenergiaZ_REV_PROG.view.fragments.MessageList", this);
				this.getView().addDependent(this.openListaErro);
			}
			return this.openListaErro;
		},

		_onRelatSemanAcumulado: function() {
			this._openDialogRelatSemanAcumulado().open();
		},

		_openDialogRelatSemanAcumulado: function() {

			if (!this.openRelatorioSemnAcum) {
				this.openRelatorioSemnAcum = sap.ui.xmlfragment(this.getView().getId(), "com.fsBioenergiaZ_REV_PROG.view.fragments.RelatSemAcum",
					this);
				this.getView().addDependent(this.openRelatorioSemnAcum);
			}
			return this.openRelatorioSemnAcum;

		},

		onCloseRelatSemanAcumulado: function() {

			this.onPressExpdColps("COLAPSAR", "TreeTableRelat");
			this.getView().getModel("revisaoView").setProperty("Relatorio/catalog/relatorio", []);
			this._openDialogRelatSemanAcumulado().close();

		},

		onTrocar: function() {

			this._openDialogTrocar().open();

		},

		onRelatUF: function() {
			this._openDialogRelatUF().open();
		},

		_openDialogRelatUF: function() {
			if (!this.openDialogRelatUF) {
				this.openDialogRelatUF = sap.ui.xmlfragment(this.getView().getId(), "com.fsBioenergiaZ_REV_PROG.view.fragments.RelatUF", this);
				this.getView().addDependent(this.openDialogRelatUF);
			}
			return this.openDialogRelatUF;
		},

		onCloseRelatUf: function() {
			var produto = this.getView().byId("relatUFProduto").setSelectedKey("");
			var caminhao = this.getView().byId("relatUFCaminhao").setSelectedKey("");
			var planta = this.getView().byId("relatUFPlanta").setSelectedKey("");
			var incoterm = this.getView().byId("relatUFIncoterm").setSelectedKey("");
			this.getView().getModel("revisaoView").setProperty("/tabRelatUF", []);
			this._openDialogRelatUF().close();
		},

		_openDialogTrocar: function() {
			if (!this.openDialogTrocar) {
				this.openDialogTrocar = sap.ui.xmlfragment(this.getView().getId(), "com.fsBioenergiaZ_REV_PROG.view.fragments.trocar", this);
				this.getView().addDependent(this.openDialogTrocar);
			}
			return this.openDialogTrocar;
		},

		dialogTrocarCancel: function() {
			var fileUP = this.getView().byId("UpTrocaTab");

			fileUP.clear();
			this._openDialogTrocar().close();
		},

		onPrevExcelDataCancel: function(oEvent) {
			this.getView().getModel("revisaoView").setProperty("/excelData", []);
			this._openDialogUpload().close();
			this.dialogTrocarCancel();
		},

		_openDialogUpload: function() {
			if (!this.dialogInserAreaData) {
				this.dialogInserAreaData = sap.ui.xmlfragment(this.getView().getId(), "com.fsBioenergiaZ_REV_PROG.view.fragments.UpTable", this);
				this.getView().addDependent(this.dialogInserAreaData);
			}
			return this.dialogInserAreaData;
		},

		getExtension: function(filename) {
			var parts = filename.split('.');
			return parts[parts.length - 1];
		},


		/* TRATAMENTO DE DADOS PARA PRÉ VISUALIZAÇÃO DO ARQUIVO EXCEL - INICIO */
		fileUploader: function(oEvent) {
			this._file(oEvent.getParameter("files") && oEvent.getParameter("files")[0]);
		},

		_file: function(file) {
			var that = this;
			var excelData = {};
			var oViewModel = this.getView().getModel("revisaoView");
			if (file && window.FileReader) {
				var reader = new FileReader();
				reader.onload = function(e) {
					var data = e.target.result;
					var workbook = XLSX.read(data, {
						type: 'binary',
						cellDates: true
					});
					workbook.SheetNames.forEach(function(sheetName) {
						// Here is your object for every sheet in workbook
						excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]); //XLSX.utils.sheet_to_row_object_array

					});

					for (var i = 0; i < excelData.length; i++) {
						Object.keys(excelData[i]).forEach(val => {
							var replacedKey = val.replace(/\s/g, "");

							if (val !== replacedKey) {
								excelData[i][replacedKey] = excelData[i][val];
								delete excelData[i][val]
							}
						})

						if (typeof(excelData[i].DATA) == "object") {
							excelData[i].DATA = excelData[i].DATA.toLocaleDateString();
						}

					}
					oViewModel.setProperty("/excelData", excelData);
					this._openDialogUpload().open();
				}.bind(this);
				reader.readAsBinaryString(file);
			}
		},

		/* TRATAMENTO DE DADOS PARA PRÉ VISUALIZAÇÃO DO ARQUIVO EXCEL - FIM */
		trataDadosExport: function(sProperty) {
			var oDadosExport = this.getView().getModel("revisaoView").getProperty(sProperty);

			if (sProperty == "/dadosProgExport") {

				for (let index in oDadosExport) {
					oDadosExport[index].DATA = formatter.formatDate(oDadosExport[index].DATA);
				}
				this.getView().getModel("revisaoView").setProperty(sProperty, oDadosExport);

			} else if (sProperty == "/tabRelatUFExport") {

				for (let index in oDadosExport) {
					oDadosExport[index].DATA = formatter.formatDate(oDadosExport[index].DATA);
				}
				this.getView().getModel("revisaoView").setProperty(sProperty, oDadosExport);
			}
		},

		exportExcel: function(sProperty) {
			var aCols, aContratos, oSettings, oSheet, fileName;

			aContratos = this.getView().getModel("revisaoView").getProperty(sProperty);

			if (sProperty == "/dadosProgExport") {

				aCols = this.createColumnConfig();
				fileName = "Dados Programação";

			} else if (sProperty == "/tabRelatUFExport") {
				aCols = this.createColumnConfigRelatUF();
				fileName = "Dados relatório por UF";
			};

			oSettings = {
				workbook: {
					columns: aCols
				},
				dataSource: aContratos,
				fileName: fileName
			};

			oSheet = new Spreadsheet(oSettings);
			oSheet.build()
				.then(function() {
					MessageToast.show('Documento exportado');
				})
				.finally(oSheet.destroy);
		},
		createColumnConfig: function() {
			return [{
				label: 'COD_CLIE',
				property: 'COD_CLIE',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'CLIENTE',
				property: 'CLIENTE',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'CIDADE',
				property: 'CIDADE',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'UF',
				property: 'UF',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'CIF_FOB',
				property: 'CIF_FOB',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'TIPO_CAMINHAO',
				property: 'TIPO_CAMINHAO',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'PRODUTO',
				property: 'PRODUTO',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'PLANTA',
				property: 'PLANTA',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'VENDEDOR',
				property: 'VENDEDOR',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'DATA',
				property: 'DATA',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'VOLUME',
				property: 'VOLUME',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'TIPO',
				property: 'TIPO',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'JUSTIFICATIVA',
				property: 'JUSTIFICATIVA',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'APR_PLANEJAMENTO',
				property: 'APR_PLANEJAMENTO',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'RJ_PLANEJAMENTO',
				property: 'RJ_PLANEJAMENTO',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'APR_COMERCIAL',
				property: 'APR_COMERCIAL',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'RJ_COMERCIAL',
				property: 'RJ_COMERCIAL',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'APR_LOGISTICA',
				property: 'APR_LOGISTICA',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'RJ_LOGISTICA',
				property: 'RJ_LOGISTICA',
				type: EdmType.String,
				width: '20'
			}];
		},

		createColumnConfigRelatUF: function() {
			return [{
				label: 'Estado',
				property: 'UF',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'Data',
				property: 'DATA',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'Produto',
				property: 'PRODUTO',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'Planta',
				property: 'PLANTA',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'Incoterm',
				property: 'INCOTERM',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'Carga',
				property: 'CARGA',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'Tipo de veículo',
				property: 'TIPO_VEICULO',
				type: EdmType.String,
				width: '20'
			}, {
				label: 'N° de cargas',
				property: 'N_CARGAS',
				type: EdmType.String,
				width: '20'
			}];
		},

		/* EXPORTAÇÃO TREE TABLE - INICIO */

		onDownload: function(oEvent) {
			var jsonData = this.getView().getModel("revisaoView").getData().Relatorio.catalog.relatorio.categories;
			this.JSONToCSVConvertor(jsonData);
		},

		JSONToCSVConvertor: function(JSONData) {

			var arrData = JSONData;
			var CSV = '';
			var row = ""; // To add Table column header in excel
			var row1 = "";
			var table = this.getView().byId("TreeTableRelat");

			table.getColumns().forEach(function(column) {
				row1 += '"' + column.getLabel().getText() + '";';
			});
			CSV += '"";' + '"";' + row1 + '\r\n'; //Row that will create Header Columns

			var column = {
				"name": "name",
				"COTA": "COTA",
				"PROGRAMADO": "PROGRAMADO",
				"FATURADO": "FATURADO",
				"TOTAL": "TOTAL",
				"SALDO": "SALDO"
			};
			var i, j, k;

			var createRow = function(level) {

				if (level === "Parent") {
					if (i != 0) {
						row += "\r\n";
					}

					row += '"' + arrData[i][column.name] + '";';
					CSV += row + "\r\n";
				} else if (level === "Child") {
					row = ";";
					row += ";";
					row += '"' + arrData[i].categories[j][column.name] + '";';
					row += '"' + arrData[i].categories[j][column.COTA] + '";';
					row += '"' + arrData[i].categories[j][column.PROGRAMADO] + '";';
					row += '"' + arrData[i].categories[j][column.FATURADO] + '";';
					row += '"' + arrData[i].categories[j][column.TOTAL] + '";';
					row += '"' + arrData[i].categories[j][column.SALDO] + '";';
					CSV += row + "\r\n";
				} else if (level === "Children") {
					row = ";";
					row += '"' + arrData[i].categories[j][column.name] + '";';
					CSV += row + "\r\n";
				} else {
					row = ";";
					row += ";";
					row += '"' + arrData[i].categories[j].categories[k][column.name] + '";';
					row += '"' + arrData[i].categories[j].categories[k][column.COTA] + '";';
					row += '"' + arrData[i].categories[j].categories[k][column.PROGRAMADO] + '";';
					row += '"' + arrData[i].categories[j].categories[k][column.FATURADO] + '";';
					row += '"' + arrData[i].categories[j].categories[k][column.TOTAL] + '";';
					row += '"' + arrData[i].categories[j].categories[k][column.SALDO] + '";';

					row = row.replaceAll("undefined", "");
					row = row.replace(/['"]+/g, '');
					row = row.replace(/[,]+/g, '');
					CSV += row + "\r\n";
				}
			};

			//loop is to extract each row 
			for (i = 0; i < arrData.length; i++) {
				createRow("Parent");
				if (arrData[i].categories.length > 0) {
					for (j = 0; j < arrData[i].categories.length; j++) {

						if (arrData[i].categories[j].categories) {
							createRow("Children");
							if (arrData[i].categories[j].categories.length > 0) {
								for (k = 0; k < arrData[i].categories[j].categories.length; k++) {
									createRow("Kid");
								}
							}
						} else {
							createRow("Child");
						};
					}
				}
			}

			if (CSV === '') {
				sap.m.MessageToast.show("Invalid data");
				return;
			}

			var xlsxB64 = this.convertCSVToXlsX(CSV);
			xlsxB64 = atob(xlsxB64)
			var byteNumbers = new Array(xlsxB64.length);
			for (var i = 0; i < xlsxB64.length; i++) {
				byteNumbers[i] = xlsxB64.charCodeAt(i);
			}
			var byteArray = new Uint8Array(byteNumbers);
			var blob = new Blob([byteArray], {
				type: "pdf"
			});

			let a = document.createElement("a")
			let blobURL = URL.createObjectURL(blob)
			a.download = "teste.xlsx"
			a.href = blobURL
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
		},

		convertCSVToXlsX: function(CSV_DATA) {
			var arrayOfArrayCsv = CSV_DATA.split("\r\n").map(row => {
				return row.split(";")
			});

			for (var i = 0; i < arrayOfArrayCsv.length; i++) {
				for (var k = 0; k < arrayOfArrayCsv[i].length; k++) {
					arrayOfArrayCsv[i][k] = arrayOfArrayCsv[i][k].replace(/['"]+/g, '')

				}
			}

			var wb = XLSX.utils.book_new();
			var newWs = XLSX.utils.aoa_to_sheet(arrayOfArrayCsv);
			XLSX.utils.book_append_sheet(wb, newWs);
			var rawExcel = XLSX.write(wb, {
				type: 'base64'
			})
			return rawExcel

		}

		/* EXPORTAÇÃO TREE TABLE - FIM */
	});
});