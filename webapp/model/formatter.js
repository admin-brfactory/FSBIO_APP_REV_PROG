sap.ui.define(function() {
	"use strict";
// var globalValue;
	return {

		formatCheckBox: function(sValue) {
			if (!sValue) {
				return;
			}

			if (sValue == "X") {
				return true;
			} else {
				return false;
			}
		},

		checkBoxEnabled: function(sValue) {
			this.validaCheckBoxAprRej();
			return;
		},

		formatDateToABAP: function(sValue) {
			if (!sValue) {
				return;
			}

			sValue = sValue.substr(6) + sValue.substr(3, 2) + sValue.substr(0, 2);

			return sValue;
		},

		formatDate: function(sValue) {
			if (!sValue) {
				return;
			}

			sValue = sValue.substr(6) + "/" + sValue.substr(4, 2) + "/" + sValue.substr(0, 4);

			return sValue;
		}

	};
});