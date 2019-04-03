$('.carousel').carousel('pause');

$('#loginDropParent').on('hidden.bs.dropdown', function () {
	$('.carousel').carousel(0);
});

function signin(form, e){

	event.preventDefault();
	event.stopPropagation();
	
	if (form.checkValidity() === false)
		return;
	
	post({email: form["email"].value,
			password: form["password"].value},
			form.action, (responseText) => {
		var userId = Number(responseText);
		if(userId && userId>0){
			window.localStorage.userId = userId;
			location.reload();
		}
		else
			alert('Incorrect Email/Password!');
	});
}

function signup(form, e){

	event.preventDefault();
	event.stopPropagation();
	
	if (form.checkValidity() === false)
		return;
	
	post({email: form["email"].value,
			password: form["password"].value,
			name: form["name"].value},
			form.action, (responseText) => {
		var userId = Number(responseText);
		if(userId && userId>0){
			window.localStorage.userId = userId;
			location.reload();
		}
		else
			alert("Can't Create that account!");
	});
}

function forgotPassword(form, e){
	event.preventDefault();
	event.stopPropagation();
	
	if (form.checkValidity() === false)
		return;
	
	post({email: form["email"].value},
			form.action, (responseText) => {
		$('#resetPasswordModal').modal();
	});
}

function changeLoginCarousel(button, e){
	e.stopPropagation();
	$('.carousel').carousel(Number(button.getAttribute('data-slide-to')));
}

function post(data, action, callback){
	console.log(data);
	// Post to server
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", action);
	xmlhttp.setRequestHeader("Content-Type", "application/json");
	xmlhttp.send(JSON.stringify(data));
	xmlhttp.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (xmlhttp.status === 200) {
            	callback(xmlhttp.responseText);
            }
        }
    }
}