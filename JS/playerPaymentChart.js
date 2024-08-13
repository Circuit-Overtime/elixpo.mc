const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: [{
            label: 'Hours Played',
            data: [0, 0, 0, 0, 0, 0, 200, 160, 130, 90, 170, 110],
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true,
                max: 200,
                title: {
                    display: true,
                    text: 'Hours Played'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Months of the Year'
                }
            }
        }
    }
});