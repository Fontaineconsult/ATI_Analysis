
$(window).ready(function () {
	// Variables
	let researchClicked = false;
	let impactNum = 0;
	let impactInfo = "No Details";
	const researchImpactLevel = 1000;
	const lowConst = -0.45;
	const medConst = 4;
	const highConst = 16;
	const maxLowLevel = 22;
	const maxMedLevel = 64;

	$("#clear-page").click(clear);
	$("#date-input-text").ready(function() {
		// Variables
		let dt = new Date();
		
		$("#date-info-nonprint").val(
			leadingZeros(dt.getMonth() + 1, 1) + "/" +
			leadingZeros(dt.getDate(), 1) + "/" +
			dt.getFullYear()
		);
	});
	
	/**Adds leading zeros to the given number
	 * @param {number} num - The number to add leading zeros to.
	 * @param {number} amount - The amount of zeros to add
	 * @returns {string} Returns the number in string form with leading zeros.*/
	function leadingZeros(num, amount) {
		// Variables
		let powered;
		let results = "";
		
		for(let i = amount; i > 0; i--) {
			powered = Math.pow(10, i);
			if(num < powered) {
				results += "0";
			}
			else { break; }
		}
		
		return results + num;
	}
	
	/**Clears the whole form without reloading the whole page*/
	function clear() {
		// Variables
		let checkbox = $("input[type=checkbox]");
		
		for(let i = 0; i < checkbox.length; i++) {
			checkbox[i].checked = false;
			checkbox[i].parentElement.classList.remove("crossed-out");
		}
		impactNum = 0;
		impactInfo = "No Details";
		researchClicked = false;
		$("#bar-impact").html("Please Fill Form");
		$(".required-input:not(#date-info-nonprint)").val("");
	}

	// Readies some hideable elements for printing
	window.addEventListener("beforeprint", function () {
		$("#ticket-info-print").val($("#ticket-info-nonprint").val());
		$("#vendor-info-print").val($("#vendor-info-nonprint").val());
		$("#requesting-dept-print").val($("#requesting-dept-nonprint").val());
		$("#date-info-print").val($("#date-info-nonprint").val());
		// If the access is not checked and there is a high impact, then inform user to fill it out
		if(isHighImpact() && $(".ac:checked").length == 0) {
			alert("Impact is high and access section is not filled out. Please fill it out to continue!");
			$(".vpat-analysis").addClass("hide");
			$("#access-high-alert").removeClass("hide");
			return;
		}
		else {
			$(".vpat-analysis").removeClass("hide");
			$("#access-high-alert").addClass("hide");
		}

		// If the public facing elements is not checked and there is a high impact, then inform user to fill it out
		if(isHighImpact() && $(".pub-mat:checked").length == 0) {
			alert("Impact is high and no publishing materials options are not selected. Please fill it out to continue!");
			$(".vpat-analysis").addClass("hide");
			$("#pub-mat-high-alert").removeClass("hide");
			return;
		}
		else {
			$(".vpat-analysis").removeClass("hide");
			$("#pub-mat-high-alert").addClass("hide");
		}
		
		let missing = [];
		let size = 0;
		
		$(".required-input").each(function(i, elem) {
			if(elem.value == "") {
				missing.push({
					elem: elem.parentElement.previousElementSibling,
					index: i
				});
				//console.dir(elem.parentElement.previousElementSibling.innerText);
			}
			size++;
		});
		
		for(let i = 0; i < size; i++) {
			$("#required-textbox-" + i).addClass("hide");
		}
		$(".vpat-analysis").removeClass("hide");
		
		if(missing.length > 0) {
			// Variables
			let alertStr = "";
			
			for(let i = 0; i < missing.length; i++) {
				alertStr += missing[i].elem.innerText + " text box was not filled in.\n";
				$("#required-textbox-" + missing[i].index).removeClass("hide");
			}
			alert(alertStr);
			$(".vpat-analysis").addClass("hide");
			return;
		}
		
		if(impactInfo == "No Details") {
			$("#print-impact-details").addClass("hide");
		}
		else {
			$("#print-impact-details").removeClass("hide");
		}
	});

	/**Finds if the current analysis is high impact.
	 * @returns {boolean} Returns true if the impact number reaches the high impact level.*/
	function isHighImpact() { return (impactNum >= maxMedLevel); }

	/**Creates the clickable logic; selecting low will cross out medium and high.
	 * @param {string} jqsel - The jQuery selector to create logic for.*/
	function createLogic(jqsel) {
		$(jqsel).click(constructClickEvent($(jqsel)));
	}
	
	/**Creates the clickable logic; selecting one will select the others same goes for deselecting.
	 * @param {string} jqsel - The jQuery selector to create logic for.*/
	function createParallelSelect(jqsel) {
		$(jqsel).click(constructParallelClickEvent($(jqsel)));
	}
	
	/**Creates the clickable logic; selecting one will select the others, deselecting (or selecting) the others will not deselect the original one.
	 * @param {string} jqsel - The first jQuery selector that creates the parallel logic for.
	 * @param {string} jqsel2 - The second jQuery selector tho create logic for.*/
	function createOneWayParallelSelect(jqsel, jqsel2) {
		$(jqsel).click(constructOneWaySelect($(jqsel), $(jqsel2)));
		$(jqsel2).click(constructOneWaySelectReverse($(jqsel2), $(jqsel)));
	}
	
	/**Constructs the clickable even for the "createLogic" function.
	 * @param {object} pair - The jQuery object that holds an array of elements to put the logic into.
	 * @returns {Function} Returns the generated click event.*/
	function constructClickEvent(pair) {
		return (function (args) {
			// Variables
			let takeout = false;
			let stop = false;
			
			pair.each(function (index, elem) {
				if(stop == true) { return; }
				
				if(elem == args.target || elem.classList[0] == args.target.classList[0]) {
					elem.parentElement.classList.remove("crossed-out");
					if(elem == args.target && elem.checked == false) {
						takeout = (pair.filter("." + elem.classList[0] + ":checked").length == 0);
					}
					return;
				}
				elem.parentElement.classList.add("crossed-out");
				if(args.target.classList.contains("acad-use")) {
					if(args.target.classList.contains("acad-emp-req")) {
						if($(".low.acad-use")[0].checked == true) {
							console.log($(".low.acad-use"));
							$(".low.acad-use").removeAttr("checked");
							$(".low.acad-use")[0].checked = false;
						}
						return;
					}
				}
				if(elem.checked) {
					$(elem).prop("checked", false);//.click();
					$(elem).removeAttr("checked");
				}
			});
			if(takeout === true) {
				pair.each(function (i, elem) {
					elem.parentElement.classList.remove("crossed-out");
				});
			}
		});
	}
	
	/**Constructs the clickable even for the "createParallelLogic" function.
	 * @param {object} pair - The jQuery object that holds an array of elements to put the logic into.
	 * @returns {Function} Returns the generated click event.*/
	function constructParallelClickEvent(pair) {
		return (function (args) {
			pair.each(function (index, elem) {
				if(elem == args.target)
					return;
				if(elem.checked != args.target.checked)
					$(elem).click();
			});
		});
	}
	
	/**Constructs the clickable even for the "createOneWayParallelLogic" function.
	 * @param {object} pair1 - The jQuery object that holds an array of elements to put the logic into.
	 * @param {object} pair2 - The jQuery object that holds an array of elements to put the logic into.
	 * @returns {Function} Returns the generated click event.*/
	function constructOneWaySelect(pair1, pair2) {
		return (function (args) {
			if(args.target.checked) {
				pair1.each(function (index, elem) {
					if(elem == args.target)
						return;
					if(!elem.checked)
						$(elem).click();
				});
				pair2.each(function (index, elem) {
					if(!elem.checked)
						$(elem).click();
				});
			}
		});
	}
	
	/**Constructs the clickable even for the "createOneWayParallelLogic" function.
	 * @param {object} pair1 - The jQuery object that holds an array of elements to put the logic into.
	 * @param {object} pair2 - The jQuery object that holds an array of elements to put the logic into.
	 * @returns {Function} Returns the generated click event.*/
	function constructOneWaySelectReverse(pair1, pair2) {
		return (function (args) {
			// Variables
			let allChecked = (pair1.length == pair1.filter("input:checked").length);

			if(!allChecked) {
				pair2.filter("input:checked").click();
			}
		});
	}
	
	/**Creates a "user-defined" logic.
	 * @param {string[]} jqsels - An array of jQuery selectors that will place the logic into it.
	 * @param {Function} func - The custom function used for the special logic.*/
	function createSpecialLogic(jqsels, func) {
		// jqsels= [jqsel1, jqsel2, ..., jqseln]
		// Variables
		let sels = [];

		for(let i = 0; i < jqsels.length; i++)
			sels[i] = $(jqsels[i]);
		for(let i = 0; i < jqsels.length; i++)
			sels[i].click(func(sels));
	}
	
	/**Constructs the clickable even for the "createResearchLogic" function.
	 * @param {object} pairs - The jQuery object that holds an array of elements to put the logic into.
	 * @returns {Function} Returns the generated click event.*/
	function researchLogic(pairs) {
		// pairs= [pair1, pair2]
		return (function (args) {
			researchClicked = true;
			if(pairs[0].filter("input:checked").length > 0) {
				isResearch = 1;
				impactNum = -1;
				if(pairs[1].filter("input:checked").length > 0) {
					isResearch = 2;
					impactNum = researchImpactLevel;
				}
			}
			else {
				impactNum = 0;
			}
		});
	}
	
	/**Constructs the clickable even for the "createRequiredLogic" function.
	 * @param {object} pairs - The jQuery object that holds an array of elements to put the logic into.
	 * @returns {Function} Returns the generated click event.*/
	function reqLogic(pairs) {
		return (function(args) {
			// Variables
			let takeout = false;

			pairs[0].each(function (index, elem) {
				if(elem == args.target || elem.classList[0] == args.target.classList[0]) {
					// elem.parentElement.classList.remove("crossed-out");
					if(elem == args.target && elem.checked == false) {
						takeout = (pairs[0].filter("." + elem.classList[0] + ":checked").length == 0);
					}
					return;
				}
				if($(".acad-emp-req:checked").length > 0) {
					elem.parentElement.classList.remove("crossed-out");
					takeout = true;
					return;
				}
				if(elem.checked) {
					$(elem).prop("checked", false);//.click();
					$(elem).removeAttr("checked");
				}
				elem.parentElement.classList.add("crossed-out")
			});
			if(takeout === true) {
				$(".acad-emp-req").each(function (i, elem) {
					elem.parentElement.classList.remove("crossed-out");
				});
			}
		});
	}

	/*** LOGIC STUFF HERE ***/

	createParallelSelect(".fac-use");
	createParallelSelect(".stud-use");

	createLogic(".users");
	createLogic(".pub-facing");
	createLogic(".student-use");
	createLogic(".acad-use");
	createLogic(".pub-mat");
	createLogic(".roll-out");
	createLogic(".dept");
	createLogic(".num-fac");
	createLogic(".num-stud");
	createLogic(".ac");

	createOneWayParallelSelect(".campus", ".campus-2");
	createParallelSelect(".campus");

	createSpecialLogic([".research", ".research-pa"], researchLogic);
	createSpecialLogic([".acad-emp-req"], reqLogic);

	$("#fd-users-sel").click(function (args) {
		updateImpactMatrix();
	});
	
	/**Updates the impact level on the top bar.*/
	function updateImpactLevel() {
		if(impactNum < maxLowLevel)
			$("#impact-level").html("Low");
		else if(impactNum < maxMedLevel)
			$("#impact-level").html("Medium");
		else
			$("#impact-level").html("High");
	}
	
	/**Updates the impact matrix.*/
	function updateImpactMatrix() {
		updateImpactLevel();
		displayDetails($(".details"));

		// Variables
		let temp;

		removeLights("#print-impact-matrix .col");

		// === AUDIENCE / USERS ===
		temp = $(".users:checked");
		if(temp.length > 0) {
			if(temp[0].classList.contains("high")) {
				$("#fd-users").show();
				lightUp("audience", getUserDetails());
			}
			else {
				$("#fd-users").hide();
				$("#curr-audience").html("Affects optional program / service");
				greenredlight("#low-audience", "#med-audience, #high-audience");
			}
		}
		else {
			$("#fd-users").hide();
			$("#curr-audience").html("Unknown amount of users");
		}

		// === ACCESS ===
		temp = $(".ac:checked");
		if(temp.length == 0 || temp[0].classList.contains("low")) {
			$("#curr-access").html("Does not limit access");
			greenredlight("#low-access", "#med-access, #high-access");
		}
		else if(temp[0].classList.contains("med")) {
			$("#curr-access").html("Limits access");
			greenredlight("#med-access", "#low-access, #high-access");
		}
		else {
			$("#curr-access").html("Denies access");
			greenredlight("#high-access", "#low-access, #med-access");
		}

		// === LEGAL EXPOSURE ===
		temp = $(".leg-exp:checked");
		if(temp.length == 0 || temp[temp.length - 1].classList.contains("low")) {
			$("#curr-legal-exposure").html("There is little to no exposure");
			greenredlight("#low-legal-exposure", "#med-legal-exposure, #high-legal-exposure");
		}
		else if(temp[temp.length - 1].classList.contains("med")) {
			$("#curr-legal-exposure").html("There is moderate exposure");
			greenredlight("#med-legal-exposure", "#low-legal-exposure, #high-legal-exposure");
		}
		else {
			$("#curr-legal-exposure").html("There is significant exposure");
			greenredlight("#high-legal-exposure", "#low-legal-exposure, #med-legal-exposure");
		}

		// === SCOPE ===
		temp = $(".scope-dept:checked");
		if(temp.length > 0) {
			if(temp[0].classList.contains("low")) {
				$("#curr-scope").html("Only 1 department, organization, or course");
				greenredlight("#low-scope", "#med-scope, #high-scope");
			}
			else if(temp[0].classList.contains("med")) {
				$("#curr-scope").html("Multiple departments, organizations, or courses");
				greenredlight("#med-scope", "#low-scope, #high-scope");
			}
			else {
				$("#curr-scope").html("Campus-wide");
				greenredlight("#high-scope", "#low-scope, #med-scope");
			}
		}
		else {
			$("#curr-scope").html("Unknown use of departments");
		}

		// === LOCATION ===
		temp = $(".lu.pub-facing:checked");
		if(temp.length > 0) {
			if(temp[0].classList.contains("high")) {
				$("#curr-location").html("In a public space");
				greenredlight("#high-location", "#low-location, #med-location");
			}
			else if(temp[0].classList.contains("med")) {
				$("#curr-location").html("In a semi-public space");
				greenredlight("#med-location", "#low-location, #high-location");
			}
			else {
				$("#curr-location").html("In a non-public space");
				greenredlight("#low-location", "#med-location, #high-location");
			}
		}
		else {
			$("#curr-location").html("Unknown location of use");
		}
	}
	
	/**Gets the user details.
	 * @returns {number} Returns the selection the user did in the impact details.*/
	function getUserDetails() {
		return ($("#fd-users-sel")[0].options.selectedIndex);
	}
	
	/**Adds a green and red light markings to the selections.
	 * @param {string} greenlitClasses - The classes used to green light the checkboxes.
	 * @param {string} redlitClasses - The classes used to red light the checkboxes.*/
	function greenredlight(greenlitClasses, redlitClasses) {
		if(greenlitClasses != "")
			$(greenlitClasses).addClass("greenlight");
		if(redlitClasses != "")
			$(redlitClasses).addClass("redlight");
	}
	
	/**Lights up the sections using the type and the impact flag.
	 * @param {string} type - The type of section to light up. So far its only "audience".
	 * @param {number} flag - The number found from the "getUserDetails" function.*/
	function lightUp(type, flag) {
		switch(type) {
			case "audience": {
				switch(flag) {
					case 0: {
						$("#curr-" + type).html("Affects important non-critical and/or critical program / service");
						greenredlight("#high-" + type + ", #med-" + type, "#low-" + type);
					} break;
					case 1: {
						$("#curr-" + type).html("Affects important but non-critical program / service");
						greenredlight("#med-" + type, "#low-" + type + ", #high-" + type);
					} break;
					case 2: {
						$("#curr-" + type).html("Affects critical program / service");
						greenredlight("#high-" + type, "#low-" + type + ", #med-" + type);
					} break;
				}
			} break;
		}
	}
	
	/**Removes the greenlight/redlight classes.
	 * @param {string} classes - The jQuery selectors for classes to remove the lights.*/
	function removeLights(classes) {
		// Variables
		const cc = $(classes);

		cc.removeClass("greenlight");
		cc.removeClass("redlight");
	}

	/*** DEBUG BAR HERE ***/
	$("input[type=checkbox]").click(function (args) {
		// Variables
		let low = $("input.low:checked");
		let med = $("input.med:checked");
		let high = $("input.high:checked");
		let impactInfo = $("#bar-impact");

		if(args.target.checked)
			args.target.setAttribute("checked", "true");
		else
			args.target.removeAttribute("checked");

		if(impactNum != -1 && impactNum != researchImpactLevel) {
			impactNum = (
				lowConst * low.length +
				medConst * med.length +
				highConst * high.length
			);
		}
		if(impactNum == researchImpactLevel) {
			impactNum = maxLowLevel + 1;
		}

		if(impactNum < maxLowLevel)
			impactInfo.html("Low Impact");
		else if(impactNum < maxMedLevel)
			impactInfo.html("Medium Impact. Check Details");
		else
			impactInfo.html("High Impact. Check Details");
		if(researchClicked)
			isResearch = 0;
		researchClicked = false;

		updateImpactMatrix();
	});

	$("#impact-details-btn").click(function (args) {
		displayDetails($(".details"));
		$("#impact-details").modal("show");
	});
	
	/**Displays the details in the impact details.
	 * @param {string} details - The jQuery selector to place the text into.*/
	function displayDetails(details) {
		// Variables
		let checkboxes = $(".selectable input");
		
		impactInfo = "";

		// 21+ Users
		if(checkboxes[7].checked && getUserDetails() == 0) {
			impactInfo += "- Please confirm the total number of users for each applicable user group (faculty/staff/student).<br/>";
		}
		// Public Facing Components
		if(checkboxes[6].checked) {
			impactInfo += (
				"- This product may contain components that are publicly accessible. " +
				"Please describe in detail how public facing components may be used or accessed.<br/>"
			);
		}
		// Public Facing
		if(checkboxes[10].checked) {
			impactInfo += (
				"- This product has been deemed public facing and as such must be accessible. " +
				"Further detail about the products’ proposed use may be needed. " +
				"Please describe in detail how users may interact with any public facing components of this product.<br/>"
			);
		}
		// Limits Access
		if(checkboxes[12].checked) {
			impactInfo += (
				"- This product may limit access for persons with disabilities to a program/service. " +
				"Supplemental documentation may be required.<br/>"
			);
		}
		// Denies Access
		if(checkboxes[13].checked) {
			impactInfo += (
				"- This product may deny access for persons with disabilities to a program/service. " +
				"Supplemental documentation will be required if use of this product is recommended.<br/>"
			);
		}
		// Required for Employment Purposes
		if(checkboxes[20].checked) {
			impactInfo += (
				"- This product must be accessible to faculty/staff. Employment should not be denied to persons with disabilities applying for positions requiring the use of this product. " +
				"Please describe in detail how this product is required for faculty/staff use as a part of their employment.<br/>"
			);
		}
		// Required for Academic Purposes
		if(checkboxes[25].checked) {
			impactInfo += (
				"- This product must be accessible to students. " +
				"Please describe in detail the academic requirement for this product. " +
				"What workarounds exist for students if they are unable to access this product as it is intended?<br/>"
			);
		}
		// May Publish Materials Used by Specific (Limited) Audiences
		if(checkboxes[29].checked) {
			impactInfo += (
				"- Is this product used for content creation/publication or dissemination of electronic content? " +
				"If yes, please describe in detail what content will be created, where content can be accessed and by whom.<br/>"
			);
		}
		// Publishes Public Facing Materials
		if(checkboxes[31].checked) {
			impactInfo += (
				"- This product may publish or contain content and/or materials that are publicly accessible. " +
				"Please describe in detail what electronic content or documents are created with this product, where content can be accessed and by whom.<br/>"
			);
		}
		// Multiple Departments, Organizations, or Courses
		if(checkboxes[37].checked) {
			impactInfo += (
				"- Please describe in detail (if you have not already) which department(s), organization(s), or course(s) will use this product and how.<br/>"
			);
		}
		// Semi-public (Service Offices, Public Spaces)
		if(checkboxes[38].checked) {
			impactInfo += (
				"- Please describe in detail the semi-public physical location and/or virtual environment for this product, including how it is intended to be accessed/used.<br/>"
			);
		}
		// Public (Lab e.g. Learning Commons / Classroom / Public Space)
		if(checkboxes[41].checked) {
			impactInfo += (
				"- Please describe in detail the public physical and/or virtual environment for this product, including how it is intended to be accessed/used.<br/>"
			);
		}

		// Research related
		if(checkboxes[2].checked || checkboxes[35].checked) {
			if(checkboxes[19].checked || checkboxes[25].checked) {
				impactInfo += "- Please describe in detail how this product will be used for research including estimated number of users for applicable groups (faculty/staff/students), duration of use, and impact on student academics (if applicable).";
			}
			else {
				impactInfo = "<center>Low impact for research purposes. No further review required.</center>";
			}
		}

		if(impactInfo == "") {
			impactInfo = "No Details";
		}
		
		details.html(impactInfo);
		
	}

	updateImpactMatrix();
});
