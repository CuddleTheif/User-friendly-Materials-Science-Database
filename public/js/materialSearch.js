var periodicTable = document.getElementById("periodicTable");

// Search the database
function validateMaterial(event){
	
	// Stop default behavior
    event.preventDefault();
    event.stopPropagation();
	
	var form = document.forms["materialForm"];
	var data = {};
	
	// Get basic sample data first
	data.sample = {};
	var curData = getMinMaxData(form, 'thickness');
	if(curData)
		data.sample.thickness = curData.none ? null : curData;
	curData = getMinMaxData(form, 'peakCount');
	if(curData)
		data.sample.peak_count = curData.none ? null : curData;
	curData = getMinMaxData(form, 'optDirectBandgap');
	if(curData)
		data.sample.opt_direct_bandgap_ev = curData.none ? null : curData;
	curData = getMinMaxData(form, 'optAverageVisTrans');
	if(curData)
		data.sample.opt_average_vis_trans = curData.none ? null : curData;
	curData = getMinMaxData(form, 'resistivity');
	if(curData)
		data.sample.resistivity = curData.none ? null : curData;
	curData = getMinMaxData(form, 'conductivity');
	if(curData)
		data.sample.conductivity = curData.none ? null : curData;
	curData = getMinMaxData(form, 'standardDeviation');
	if(curData)
		data.sample.standard_deviation = curData.none ? null : curData;
	curData = getMinMaxData(form, 'sheetResistance');
	if(curData)
		data.sample.sheet_resistance = curData.none ? null : curData;
	curData = getMinMaxData(form, 'sampleTimeMin');
	if(curData)
		data.sample.sample_time_min = curData.none ? null : curData;
	curData = getMinMaxData(form, 'basePressureMtorr');
	if(curData)
		data.sample.base_pressure_mtorr = curData.none ? null : curData;
	curData = getMinMaxData(form, 'growthPressureMtorr');
	if(curData)
		data.sample.growth_pressure_mtorr = curData.none ? null : curData;
	curData = getMinMaxData(form, 'targetPulses');
	if(curData)
		data.sample.target_pulses = curData.none ? null : curData;
	curData = getMinMaxData(form, 'repRate');
	if(curData)
		data.sample.rep_rate = curData.none ? null : curData;
	curData = getMinMaxData(form, 'energy');
	if(curData)
		data.sample.energy = curData.none ? null : curData;
	curData = getMinMaxData(form, 'cycles');
	if(curData)
		data.sample.cycles = curData.none ? null : curData;
	curData = getMinMaxData(form, 'tSDistance');
	if(curData)
		data.sample.ts_distance = curData.none ? null : curData;
	curData = getMinMaxData(form, 'initialTemp');
	if(curData)
		data.sample.initial_temp_c = curData.none ? null : curData;
	curData = getMinMaxData(form, 'substrateMaterial');
	if(curData)
		data.sample.substrate_material = curData.none ? null : curData;
	
	// Get data from the table
	var elementButtons = periodicTable.getElementsByClassName("btn-primary");
	data.elements = {element_name:[]};
	for(var i=0;i<elementButtons.length;i++)
		if(elementButtons[i].classList.contains("active"))
			data.elements.element_name.push(elementButtons[i].innerHTML);
	if(data.elements.element_name.length<=0)
		data.elements = null;
	console.log(data.elements ? data.elements.element_name : null);
		
	// Post to server
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", "/search");
	xmlhttp.setRequestHeader("Content-Type", "application/json");
	xmlhttp.send(JSON.stringify(data));
	xmlhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (xmlhttp.status === 200) {
            	$("html").html(xmlhttp.responseText);
            }
        }
    }
	return false;
}

// gets min max data from the given form
function getMinMaxData(form, field){
	console.log(field);
	if(form[field+'Min'].parentElement.parentElement.hidden)
		return null;
	if(form[field+'Min'].previousElementSibling.children[0].innerHTML == "=")
		return form[field+'Min'].value;
	if(form[field+'Min'].previousElementSibling.children[0].innerHTML == "None")
		return {none: true};
	var data = {min: !form[field+'Min'].hidden ? form[field+'Min'].value : null, 
				max: !form[field+'Max'].hidden ? form[field+'Max'].value : null};
	if(data.min==null && data.max==null)
		return null;
	return data;
}

// Remove a field with the given X button
function removeField(button){
	
	// Hide the field
	var row = button.parentElement.parentElement.parentElement;
	row.setAttribute("hidden", true);
	
	// Find the field's num
	var num = -1;
	for(var pre = row.previousElementSibling;pre!=null;pre=pre.previousElementSibling)
		num++;
	
	// Add it to the dropdown
	row.parentElement.children[0].getElementsByClassName("dropdown-item")[num].removeAttribute("hidden");
	
}

// Change field to Equals
function equalsButton(button){

	activateButton(button);
	var inputDiv = button.parentElement.parentElement.parentElement;
	var inputs = inputDiv.getElementsByTagName("input");
	inputs[0].removeAttribute("hidden");
	inputs[0].setAttribute("placeholder", inputs[0].name[0].toUpperCase()+inputs[0].name.substring(1,inputs[0].name.length-3).replace( /([A-Z])/g, " $1" )+" Value");
	inputs[1].setAttribute("hidden", true);
	
}

//Change field to grater than
function greaterThanButton(button){

	activateButton(button);
	var inputDiv = button.parentElement.parentElement.parentElement;
	var inputs = inputDiv.getElementsByTagName("input");
	inputs[0].removeAttribute("hidden");
	inputs[0].setAttribute("placeholder", "Min "+inputs[0].name[0].toUpperCase()+inputs[0].name.substring(1,inputs[0].name.length-3).replace( /([A-Z])/g, " $1" )+" Value");
	inputs[1].setAttribute("hidden", true);
	
}

//Change field to less than
function lessThanButton(button){

	activateButton(button);
	var inputDiv = button.parentElement.parentElement.parentElement;
	var inputs = inputDiv.getElementsByTagName("input");
	inputs[1].removeAttribute("hidden");
	inputs[1].setAttribute("placeholder", "Max "+inputs[1].name[0].toUpperCase()+inputs[1].name.substring(1, inputs[1].name.length-3).replace( /([A-Z])/g, " $1" )+" Value");
	inputs[0].setAttribute("hidden", true);
	
}

//Change field to between
function betweenButton(button){
	
	activateButton(button);
	var inputDiv = button.parentElement.parentElement.parentElement;
	var inputs = inputDiv.getElementsByTagName("input");
	inputs[0].removeAttribute("hidden");
	inputs[0].setAttribute("placeholder", "Min "+inputs[0].name[0].toUpperCase()+inputs[0].name.substring(1,inputs[0].name.length-3).replace( /([A-Z])/g, " $1" )+" Min Value");
	inputs[1].removeAttribute("hidden");
	inputs[1].setAttribute("placeholder", "Max "+inputs[1].name[0].toUpperCase()+inputs[1].name.substring(1, inputs[1].name.length-3).replace( /([A-Z])/g, " $1" )+" Max Value");
	
}

//Change field to none
function noneButton(button){
	
	activateButton(button);
	var inputDiv = button.parentElement.parentElement.parentElement;
	var inputs = inputDiv.getElementsByTagName("input");
	inputs[0].setAttribute("hidden", true);
	inputs[1].setAttribute("hidden", true);
}

// Make the given button the active one
function activateButton(button){
	// Make this the active button
	var allButtons = button.parentElement.children;
	for(var i=0;i<allButtons.length;i++)
		allButtons[i].classList.remove('active');
	button.classList.add('active');
	button.parentElement.previousElementSibling.innerHTML = button.innerHTML;
}

// Add a field to the search
function addField(button){
	
	// Remove this field from adding fields and find the row to add
	var num = 0;
	for(var pre = button.previousElementSibling;pre!=null;pre=pre.previousElementSibling)
		num++;
	button.setAttribute("hidden", true);
	var buttonRow = button.parentElement.parentElement.parentElement.parentElement;
	var fieldRow = buttonRow.nextElementSibling;
	for(var i=0;i<num;i++)
		fieldRow = fieldRow.nextElementSibling;
	
	// Add the row
	fieldRow.removeAttribute("hidden");
}