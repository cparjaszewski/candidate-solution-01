import { findIndex } from "lodash";
import * as mixins from "./mixins.js";
import * as localstorage from "./localstorage.js";


(function(){
	"use strict";

	var adminInputs	= [],
		maxId 		= 0,
		wto			= null,
		wtoTime		= 1000;
	$(document).ready(function(){
		if(adminInit())
		{
			showToast("Successfully loaded");
		}

		// show and hide tabs
		(function(){
			$('a[data-toggle="tab"][href="#preview"]').on('show.bs.tab',function()
			{
				initPreview();
			});
			$('a[data-toggle="tab"][href="#preview"]').on('hide.bs.tab',function()
			{
				$("#preview").html("");
			});

			$('a[data-toggle="tab"][href="#create"]').on('show.bs.tab',function()
			{
				if(adminInit())
				{
					showToast("Successfully loaded");
				}
			});
			$('a[data-toggle="tab"][href="#create"]').on('hide.bs.tab',function()
			{
				$("#create .forms-box").html("");
			});

			$('a[data-toggle="tab"][href="#export"]').on('show.bs.tab',function()
			{
				$("#export textarea").val(JSON.stringify(adminInputs));

			});
			$('a[data-toggle="tab"][href="#export"]').on('hide.bs.tab',function()
			{
				let val = $("#export textarea").val();
				if(mixins.IsJsonString(val))
				{
					adminInputs = JSON.parse(val);
					showToast("New data has been downloaded");
				}
				else
				{
					showToast("Data error");
				}
			});
		}())

		$(".add-input-button").on("click",() => addInputButton());

		$(".forms-box").on("input",".input-box input", function(){
			formGroupChange($(this));
		});

		$(".forms-box").on("change",".input-box select", function(){
			formGroupChange($(this));
		});

		$(".forms-box").on("click",".delete-input", function(){
			let mySection 		= $(this).closest("section"),
				myId			= parseInt(mySection.data("id")),
				searchResult 	= [];

			searchResult = search(myId);
			if(searchResult.length === 1)
			{
				adminInputs.splice(searchResult[0], 1);
			}
			else
			{
				let tmp = adminInputs[searchResult[0]];
				for(let i = 1 ; i < searchResult.length-1 ; i++)
				{
					tmp = tmp.subinputs[searchResult[i]];
				}
				tmp.subinputs.splice(searchResult[searchResult.length-1],1);
			}

			mySection.remove();
			save("Deleted");
		});

		$(".forms-box").on("click",".add-subinput", function(){
			const defaultSchemeInputs 	= mixins.getDefaultSchemeInputs();
			let mySection 				= $(this).closest("section"),
				currentLevel 			= parseInt(mySection.data("level")),
				myId 					= parseInt(mySection.data("id")),
				inputBox 				= defaultSchemeInputs.inputBoxSub,
				searchResult 			= [];

			inputBox.id = ++maxId;
			searchResult = search(myId);
			if(searchResult.length === 1)
			{
				adminInputs[searchResult[0]].subinputs.push(inputBox);
			}
			else
			{
				let tmp = adminInputs[searchResult[0]];
				for(let i = 1 ; i < searchResult.length ; i++)
				{
					tmp = tmp.subinputs[searchResult[i]];
				}
				tmp.subinputs.push(inputBox);
			}

			addInput(
				{
					target: mySection,
					level: currentLevel+1,
					
					inputBox: inputBox,
					len: maxId,
					searchResult: myId
				}
			);
		});

		// preview tab
		$("#preview").on("keyup mouseup","form input[type='number']",function(){
			let value = parseInt($(this).val());
			let level = parseInt($(this).closest("[data-level]").data("level"));
			let less_than = $(`form[data-level='${level+1}'][data-if='less_than']`);
			let greater_than = $(`form[data-level='${level+1}'][data-if='greater_than']`);

			$(`form[data-level='${level+1}'][data-if='equals']`).addClass("hidden");
			$(`form[data-level='${level+1}'][data-if='equals'][data-if-value='${value}']`).removeClass("hidden");

			less_than.addClass("hidden");
			greater_than.addClass("hidden");
			for(let i = 0; i < less_than.length ; i++)
			{
				let currentForm = less_than.eq(i);
				let form_value = parseInt(currentForm.data("ifValue"));
				if(form_value > value)
				{
					currentForm.removeClass("hidden");
				}
			}

			for(let i = 0; i < greater_than.length ; i++)
			{
				let currentForm = greater_than.eq(i);
				let form_value = parseInt(currentForm.data("ifValue"));
				if(form_value <= value)
				{
					currentForm.removeClass("hidden");
				}
			}
		});

		$("#preview").on("click","form input[type='radio']",function(){
			let value = parseInt($(this).val());
			let level = parseInt($(this).closest("[data-level]").data("level"));
			
			$(`form[data-level='${level+1}'][data-if='equals']`).addClass("hidden");
			$(`form[data-level='${level+1}'][data-if='equals'][data-if-value='${value}']`).removeClass("hidden");
		});

		$("#preview").on("input","form input[type='text']",function(){
			clearTimeout(wto);
			let value = $(this).val();
			let level = parseInt($(this).closest("[data-level]").data("level"));
			
			$(`form[data-level='${level+1}'][data-if='equals']`).addClass("hidden");
			$(`form[data-level='${level+1}'][data-if='equals'][data-if-value='${value}']`).removeClass("hidden");
		});
	});
// ============================== PREVIEW TAB ==========================================
	function initPreview()
	{
		let myJson = localstorage.get("adminInputs");
		if(null !== myJson && "" !== myJson)
		{
			adminInputs = JSON.parse(myJson);
		}

		let preview = $("#preview");
		preview.html("");
		adminInputs.forEach((input,index) => {
			addUserInput(input,index);
			addUserSubInputs(input,0,0);
		});
	}

	function addUserSubInputs(input,x,level)
	{

		if((input.subinputs && input.subinputs.length > 0) || x < 50)
		{
			level++;
			input.subinputs.forEach((subinput,index) => {
				addUserInput(subinput,index,level);
				addUserSubInputs(subinput,++x,level);
			});
		}
	}

	function addUserInput(input,index,level = 0)
	{
		let preview = $("#preview");
		let show = true;
		let form = $("<form></form>").addClass("input-box");
		let div = $("<div></div>").addClass("form-group");

		input.formGroups.forEach((formGroup) => {
			if(formGroup.name)
			{
				let name = formGroup.name.toLowerCase();
				if(name === "condition") // czyli to jest subinput
				{
					let options = formGroup.types[0].options;
					let finded = findIndex(options, {default: true});
					if(finded >= 0)
					{
						form.attr("data-if",options[finded].value);
						form.attr("data-if-value",formGroup.value);
					}
					show = false;
				}

				if(name === "question")
				{
					let label = $("<label></label>").addClass("control-label")
													.text(formGroup.value);
					div.append(label);
				}
				else if(name === "type")
				{
					formGroup.options.forEach((option) => {
						if(option.default)
						{
							if(option.value === "text")
							{
								let formInput = $("<div></div>").append(
														$("<input>").addClass("form-control")
																	.attr("type","text")
													);
								div.append(formInput);
							}
							else if(option.value === "number")
							{
								let formInput = $("<div></div>").append(
														$("<input>").addClass("form-control")
																	.attr("type","number")
													);
								div.append(formInput);
							}
							else if(option.value === "yes_no")
							{
								let formInput = $("<div></div>").append(
														$("<input>").attr("type","radio")
																	.attr("name",`radio-${index}`)
																	.attr("id",`radio-${index}-yes`)
																	.val(1)
													)
													.append(
														$("<label></lable>").text("Yes")
																			.attr("for",`radio-${index}-yes`)
													)
													.append(
														$("<input>").attr("type","radio")
																	.attr("name",`radio-${index}`)
																	.attr("id",`radio-${index}-no`)
																	.val(0)
													)
													.append(
														$("<label></lable>").text("No")
																			.attr("for",`radio-${index}-no`)
													);
								div.append(formInput);
							}
						}
					});
				}
			}
		});

		form.append(div);
		if(show === false)
		{
			form.addClass("hidden");
		}
		form.attr("data-level",level);
		form.css({
			"margin-left": (level*50)+"px"
		});
		preview.append(form);
	}
// ===================================================================================
// ============================== ADMIN TAB ==========================================
	function adminInit(){
		try {
        	$(".forms-box").html("");
			let myJson 	= localstorage.get("adminInputs");
			if(null !== myJson && "" !== myJson)
			{
				adminInputs = JSON.parse(myJson);

				adminInputs.forEach((input) => {
					input.id = 0;
					addInput(
						{
							target: $(".forms-box"),
							level: 0,
							
							inputBox: input,
							len: maxId,
						}
					);
					if(input.subinputs.length > 0)
					{
						addSubinputs(input);
					}
				});
			}
	    } catch (e) {
	        return false;
	    }
	    return true;
	}

	function search(value)
	{
		let mainIndex  = findIndex(adminInputs, { 'id': value});

		if(mainIndex === -1)
		{
			for(let i = 0, len = adminInputs.length; i < len ; i++)
			{			
				return wglab(adminInputs[i],value,[i]);
			}
		}
		return [mainIndex];
	}

	function wglab(current,value,address,parentprev = true)
	{
		let parent;
		let myArray = [];
		let x = 0; // security

		myArray = myArray.concat(address);
		while((current.subinputs && current.subinputs.length > 0) || x < 50)
		{
			parent = current;
			if(current.subinputs[0] === undefined)
			{
				wglab(parent,value,myArray,false);
			}

			current = current.subinputs[0];
			if(current.id === value)
			{
				myArray.push(0);
				return myArray;
			}
		
			if(current.subinputs && current.subinputs.length > 0 && parentprev)
			{
				myArray.push(0);
				return wglab(current,value,myArray);
			}
			
			if(parent.subinputs && parent.subinputs.length > 1)
			{
				for(let i = 1 ; i < parent.subinputs.length ; i++)
				{
					myArray.push(i);
					if(parent.subinputs[i].id === value)
					{
						return myArray;
					}
					return wglab(parent.subinputs[i],value,myArray);
				}
			}
			x++;
		}
	}

	function addInputButton(){
		const defaultSchemeInputs = mixins.getDefaultSchemeInputs();

		let inputBox 		= defaultSchemeInputs.inputBox;
			adminInputs.push(inputBox);

		addInput(
				{
					target: $(".forms-box"),
					level: 0,
					
					inputBox: inputBox,
					len: maxId
				}
			);
		showToast("Added");
	}

	function addInput(args)
	{
		let userInputScheme = mixins.getUserInputScheme(),
			inputScheme 	= userInputScheme.inputBox,
			target 			= args.target,
			inputBox 		= args.inputBox,
			box 			= $(`<${inputBox.tag}></${inputBox.tag}>`),
			len 			= args.len,
			level 			= args.level,
			types 			= [],
			myClass 		= "",
			subif 			= target.find(".subif-select").eq(0).val();

		maxId++;
		inputBox.id = maxId;
		inputScheme.id = maxId;

		inputBox.myClass.forEach((inputClass) => {
			myClass += inputClass+" ";
		});
		box.addClass(myClass);

		inputBox.formGroups.forEach((formGroup,index) => {
			let type = "",
				subtype = "",
				label = "",
				idName = "";

			myClass = "col-xs-10";

			if(formGroup.type)
			{
				switch(formGroup.type) {
					case "text":
						idName = mixins.convertToSlug(formGroup.name);

						type = $("<input>").attr("type",formGroup.type).addClass("form-control")
																	.attr("id",`${idName}-${len}-${index}`)
																	.attr("type","text");
						if(!!formGroup.value)
						{
							type.val(formGroup.value);
						}
						label = $("<label></label>").addClass("col-xs-2 control-label")
														.attr("for",`${idName}-${len}-${index}`)
														.text(`${formGroup.name}:`);
						break;
					case "select":
						idName = mixins.convertToSlug(formGroup.name);

						type = $("<select></select>").attr("id",`${idName}-${len}-${index}`)
													.addClass("form-control subif-select");

						formGroup.options.forEach((option) => {
							let optionTag = $("<option></option>");

								optionTag.val(option.value)
										.text(option.text);

								if(option.default)
								{
									optionTag.attr("selected",true);
									inputScheme.formGroup.type = option.value;
								}

							type.append(optionTag);
						});
						
						label = $("<label></label>").addClass("col-xs-2 control-label")
														.attr("for",`${idName}-${len}-${index}`)
														.text(`${formGroup.name}:`);
						break;
					case "buttons":
						type = [];
						formGroup.buttons.forEach((formbutton) => {
							let button = $("<button></button");

							myClass = "";
							formbutton.myClass.forEach((buttonClass) => {
								myClass += buttonClass+" ";
							});

							button.addClass(myClass);
							button.text(formbutton.text);
							button.attr("type","button");
							type.push(button);
						});
						myClass = "col-xs-12";
						break;
				}
			}
			else if(formGroup.types)
			{
				types = [];
				formGroup.types.forEach((el,lindex) => {
					switch(el.type) {
						case "select":
							idName = mixins.convertToSlug(formGroup.name);

							subtype = $("<select></select>").attr("id",`${idName}-${len}-${index}-${lindex}`)
														.attr("data-if",el.if)
														.addClass("form-control condition")
														.css({
															"width": "50%",
															"float": "left"
														});

							if((el.if === undefined) || (el.if === "") || (el.if === subif) || (`!${el.if}` === `!${subif}`))
							{
								el.show = 1;
							}
							else if(el.if.charAt(0) === "!" && el.if.substring(1) !== subif)
							{
								el.show = 1;
							}
							else
							{
								el.show = 0;
							}

							el.options.forEach((option) => {
								let optionTag = $("<option></option>");

									optionTag.val(option.value)
											.attr("data-if",option.if)
											.attr("data-show",0)
											.text(option.text);

									if(option.default)
									{
										optionTag.attr("selected",true);
										inputScheme.formGroup.type = option.value;
									}

									if((option.if === undefined) || (option.if === "") || (option.if === subif) || (`!${option.if}` === `!${subif}`))
									{
										option.show = 1;
									}
									else if(option.if.charAt(0) === "!" && option.if.substring(1) !== subif)
									{
										option.show = 1;
									}
									else
									{
										option.show = 0;
									}

									optionTag.attr("data-show",option.show);
								subtype.append(optionTag);
							});
							subtype.attr("data-show",el.show);
							types.push(subtype);
							label = $("<label></label>").addClass("col-xs-2 control-label")
															.attr("for",`${idName}-${len}-${index}-${lindex}`)
															.text(`${formGroup.name}:`);
						break;
						case "text":
						idName = mixins.convertToSlug(formGroup.name);

						subtype = $("<input>").attr("type",formGroup.type)
											.addClass("form-control")
											.attr("data-if",el.if)
											.attr("id",`${idName}-${len}-${index}`)
											.css({
												"width": "50%",
												"float": "left"
											});

						
						if((el.if === undefined) || (el.if === "") || (el.if === subif))
						{
							el.show = 1;
						}
						else if(el.if.charAt(0) === "!" && el.if.substring(1) !== subif)
						{
							el.show = 1;
						}
						else
						{
							el.show = 0;
						}
						subtype.attr("data-show",el.show);

						if(!!formGroup.value)
						{
							subtype.val(formGroup.value);
						}
						types.push(subtype);
						label = $("<label></label>").addClass("col-xs-2 control-label")
														.attr("for",`${idName}-${len}-${index}`)
														.text(`${formGroup.name}:`);
						break;
					}
				});
			}
			let innerDiv = $("<div></div>").addClass(myClass);

			if(formGroup.types)
			{
				types.forEach((tmp) => {
					innerDiv.append(tmp);
				});
			}
			else if("buttons" === formGroup.type)
			{
				type.forEach((button) => {
					innerDiv.append(button);
				});
			}
			else
			{
				innerDiv.append(type);
			}
			
			let div = $("<div></div>").addClass("form-group")
							.attr("data-from-group-element",index)
							.append(label)
							.append(innerDiv);

			box.append(div);
		});

		target.append(
			$("<section></section>").addClass(`input-${inputBox.id}`)
									.attr("data-level",level)
									.attr("data-id",inputBox.id)
									.css({
										"margin-left": level*50
									})
									.append(box)
		);

		$("[data-show=0]").addClass("hidden");
		save();
	}

	function addSubinputs(input)
	{
		let parent = {},
			x = 0;
		let current = input;

		while((current.subinputs && current.subinputs.length > 0) || x < 50)
		{
			parent = current;
			if(current.subinputs && current.subinputs.length > 0)
			{
				current = current.subinputs[0];
			}
			else
			{
				break;
			}

			addInput(
				{
					target: $(`.input-${parent.id}`),
					level: parseInt($(`.input-${parent.id}`).data("level"))+1,
					
					inputBox: current,
					len: maxId
				}
			);

			if(current.subinputs && current.subinputs.length > 0)
			{
				addSubinputs(parent.subinputs);
			}

			if(parent.subinputs && parent.subinputs.length > 1)
			{
				for(let i = 1 ; i < parent.subinputs.length ; i++)
				{
					addInput(
						{
							target: $(`.input-${parent.id}`),
							level: parseInt($(`.input-${parent.id}`).data("level"))+1,
							
							inputBox: parent.subinputs[i],
							len: maxId
						}
					);
					addSubinputs(parent.subinputs);
				}
			}
			x++;
		}

	}

	function formGroupChange(el)
	{
		clearTimeout(wto);
		wto = setTimeout(function() {
			let formGroupAdmin_id 	= parseInt(el.closest(".form-group").data("fromGroupElement")),
				myId 				= parseInt(el.closest("section[data-id]").data("id")),
				searchResult 		= [],
				tmpadmins;

			searchResult = search(myId);
			if(searchResult.length === 1)
			{
				tmpadmins = adminInputs[searchResult[0]];
			}
			else
			{
				tmpadmins = adminInputs[searchResult[0]];
				for(let i = 1 ; i < searchResult.length ; i++)
				{
					tmpadmins = tmpadmins.subinputs[searchResult[i]];
				}
			}

			if(el.is("input"))
			{
				tmpadmins.formGroups[formGroupAdmin_id].value = el.val();
			}
			else if(el.is("select"))
			{
				if(tmpadmins.formGroups[formGroupAdmin_id].options)
				{
					tmpadmins.formGroups[formGroupAdmin_id].options.forEach((option) => {
						option.default = option.value === el.val() ? true : false;
					});
				}
				else if(el.val() == 0 || el.val() == 1)
				{
					tmpadmins.formGroups[formGroupAdmin_id].types[1].options.forEach((option) => {
						option.default = option.value == el.val() ? true : false;
					});
					tmpadmins.formGroups[formGroupAdmin_id].value = parseInt(el.val());
				}
				else
				{
					tmpadmins.formGroups[formGroupAdmin_id].types[0].options.forEach((option) => {
						option.default = option.value === el.val() ? true : false;
					});
				}

				tmpadmins.subinputs.forEach((subinput) => {

					let formGroup = subinput.formGroups[0];
					if(formGroup.name === "Condition")
					{
						formGroup.types[0].options.forEach((option) => {
							if((option.if === undefined) || (option.if === "") || (option.if === el.val()) || (`!${el.val()}` === `!${el.val()}`))
							{
								option.show = 1;
							}
							else if(option.if.charAt(0) === "!" && option.if.substring(1) !== el.val())
							{
								option.show = 1;
							}
							else
							{
								option.show = 0;
							}
						});
					}
				});
			}

			save("Changed data");
			adminInit();
		}, wtoTime);
	}

	function save(str = '')
	{
		if(str != '')
		{
			showToast(str);
		}
		localstorage.save("adminInputs",JSON.stringify(adminInputs));
	}

	function showToast(str = '')
	{
		mixins.showToast(str);
	}
}($));