var socket = io();
var progressBar = $("#progress div"),
		progressLabel = $('#progress #label');
		subprogressBar = $("#subprogress div"),
		subprogressLabel = $('#subprogress #label');

socket.on('update progress', (data) =>{
	if(data.full){
		progressBar.show();
		progressLabel.show();
		progressBar.attr("aria-valuenow", data.part);
		progressBar.attr("aria-valuemax", data.full);
		progressBar.attr("style", "width: "+(data.part/data.full*100)+"%");
		updateTextColor(progressBar, progressLabel, data.text+data.part+" of "+data.full);
	}
	else{
		progressBar.hide();
		progressLabel.hide();
	}
});

socket.on('update subprogress', (data) =>{
	if(data.full){
		subprogressBar.show();
		subprogressLabel.show();
		subprogressBar.attr("aria-valuenow", data.part);
		subprogressBar.attr("aria-valuemax", data.full);
		subprogressBar.attr("style", "width: "+(data.part/data.full*100)+"%");
		updateTextColor(subprogressBar, subprogressLabel, data.text+data.part+" of "+data.full);
	}
	else
	{
		subprogressBar.hide();
		subprogressLabel.hide();
	}
});


function updateTextColor(bar, label, text){
	var barPos = bar.offset().left+bar.outerWidth();
	var font = label.css('font');
	var textPos = label.offset().left+label.outerWidth()/2-getTextWidth(text, font)/2;
	var lightText = "";
	var i=0;
	while(textPos+getTextWidth(lightText,font)<barPos && i<text.length) 
		lightText += text[i++];
	label.children('.text-light').html(lightText);
	label.children('.text-dark').html(text.substring(i));
}

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 * 
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 * 
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
function getTextWidth(text, font) {
    // re-use canvas object for better performance
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    context.font = font;
    var metrics = context.measureText(text);
    return metrics.width;
}