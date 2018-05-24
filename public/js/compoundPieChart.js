
//pie
var ctxP = document.getElementById("compoundPieChart").getContext('2d');
var myPieChart = new Chart(ctxP, {
    type: 'pie',
    data: {
        labels: ["Cu2O", "Zn2O2", "Se2O", "lnO"],
        datasets: [
            {
                data: [30, 35, 15, 20],
                backgroundColor: ["Blue", "Black", "Grey", "Red"],
                hoverBackgroundColor: ["Blue", "Black", "Grey", "Red"]
            }
        ]
    },
    options: {
        responsive: true
    }    
});
