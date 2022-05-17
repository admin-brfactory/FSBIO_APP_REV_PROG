sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/fsBioenergiaZ_REV_PROG/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("com.fsBioenergiaZ_REV_PROG.Component", {

		metadata: {
			manifest: "json",
			config: {
				fullWidth: true
			}
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			
			var jQueryScript = document.createElement('script');
            jQueryScript.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.15.6/jszip.js');
            document.head.appendChild(jQueryScript);


            var jQueryScript2 = document.createElement('script');
            jQueryScript2.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.15.6/xlsx.full.min.js');
            document.head.appendChild(jQueryScript2);			
		}
	});
});