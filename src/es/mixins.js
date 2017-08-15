export { getDefaultSchemeInputs, getUserInputScheme, convertToSlug, IsJsonString, showToast };

function getDefaultSchemeInputs() {
	"use strict";

	const defaultInputs = {
		inputBox: {
			id: 0,
			tag: "form",
			myClass: ["form-horizontal","input-box"],
			formGroups: [
				{
					name: "Question",
					type: "text",
					value: ""
				},
				{
					name: "Type",
					type: "select",
					options: [
						{
							value: "text",
							text: "Text",
							default: true
						},
						{
							value: "number",
							text: "Number"
						},
						{
							value: "yes_no",
							text: "Yes / No"
						}
					]
				},
				{
					type: "buttons",
					buttons: [
						{
							text: "Delete",
							myClass: ["btn","btn-danger","pull-right","delete-input"]
						},
						{
							text: "Add Sub-Input",
							myClass: ["btn","btn-primary","pull-right","add-subinput"]
						}
					]
				}
			],
			subinputs: []
		},
		inputBoxSub: {
			tag: "form",
			myClass: ["form-horizontal","input-box","input-box-sub"],
			formGroups: [
				{
					name: "Condition",
					types: [
						{
							if: "",
							type: "select",
							options: [
								{
									if: "",
									value: "equals",
									text: "Equals",
									show: 1,
									default: true
								},
								{
									if: "number",
									value: "greater_than",
									text: "Greather Than",
									show: 0,
									default: false
								},
								{
									if: "number",
									value: "less_than",
									text: "Less Than",
									show: 0,
									default: false
								}
							]
						},
						{
							if: "yes_no",
							type: "select",
							options: [
								{
									if: "",
									value: 1,
									text: "Yes",
									default: true
								},
								{
									if: "",
									value: 0,
									text: "No",
									default: false
								}
							],
							show: 0,
						},
						{
							if:"!yes_no",
							type: "text",
							show: 1,
						}
					],
					value: ""
				},
				{
					name: "Question",
					type: "text",
					value: ""
				},
				{
					name: "Type",
					type: "select",
					options: [
						{
							value: "text",
							text: "Text",
							default: true
						},
						{
							value: "number",
							text: "Number"
						},
						{
							value: "yes_no",
							text: "Yes / No"
						}
					]
				},
				{
					type: "buttons",
					buttons: [
						{
							text: "Delete",
							myClass: ["btn","btn-danger","pull-right","delete-input"]
						},
						{
							text: "Add Sub-Input",
							myClass: ["btn","btn-primary","pull-right","add-subinput"]
						}
					]
				}
			],
			subinputs: []
		}
	};

	return defaultInputs;
}

function getUserInputScheme()
{
	"use strict";
	const userInput = {
		inputBox: {
			id: 0,
			if: "",
			tag: "form",
			myClass: ["form-horizontal"],
			formGroup: {
						label: "",
						type: "",
					},
			subinputs: []
		}
	};

	return userInput;
}

function convertToSlug(str)
{
    return str.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-');
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function showToast(str = '')
{
	var toast = $("#toast");
    toast.addClass("showToast");
    toast.html(str);
    setTimeout(function(){
    	toast.removeClass("showToast");
    }, 3000);
}