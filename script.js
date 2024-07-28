document.addEventListener('DOMContentLoaded', function () {
    const municipioSelect = document.getElementById('municipioSelect');
    const planoAmostralDiv = document.getElementById('planoAmostral');

    // Carregar dados do JSON
    fetch('dados.json')
        .then(response => response.json())
        .then(data => {
            const municipios = [...new Set(data.locais.map(local => local.municipio))];
            municipios.sort();
            municipios.forEach(municipio => {
                const option = document.createElement('option');
                option.value = municipio;
                option.textContent = municipio;
                municipioSelect.appendChild(option);
            });
        });

    municipioSelect.addEventListener('change', function () {
        const selectedMunicipio = municipioSelect.value;
        if (selectedMunicipio) {
            fetch('dados.json')
                .then(response => response.json())
                .then(data => {
                    const locais = data.locais.filter(local => local.municipio === selectedMunicipio);
                    generatePlanoAmostral(locais);
                });
        } else {
            planoAmostralDiv.innerHTML = '';
        }
    });
    
function calculateSampleSize(N, e, z = 1.96, p = 0.5) {
        const n0 = (z ** 2) * (p * (1 - p)) / (e ** 2);
        const n = (N * n0) / (N + n0);
        return Math.round(n);
    }

    function generatePlanoAmostral(locais) {
        planoAmostralDiv.innerHTML = '';
        if (locais.length === 0) {
            planoAmostralDiv.textContent = 'Nenhum local encontrado para o município selecionado.';
            return;
        }

        const bairros = {};
        locais.forEach(local => {
            if (!bairros[local.bairro]) {
                bairros[local.bairro] = 0;
            }
            bairros[local.bairro] += local.total_eleitores;
        });

        const totalVotantes = Object.values(bairros).reduce((sum, votantes) => sum + votantes, 0);
        const errosRelativos = [0.04, 0.05, 0.06]; // Erros relativos: 4%, 5%, 6%

        const table = document.createElement('table');
        table.border = 1;

        const headerRow = document.createElement('tr');
        const headers = ['Bairro', 'Votantes', 'Entrevistas (4%)', 'Entrevistas (5%)', 'Entrevistas (6%)'];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Ordenar bairros por número de votantes em ordem decrescente
        const sortedBairros = Object.entries(bairros).sort((a, b) => b[1] - a[1]);

        let totalEntrevistas4 = 0;
        let totalEntrevistas5 = 0;
        let totalEntrevistas6 = 0;

        sortedBairros.forEach(([bairro, votantes]) => {
            const entrevistas4 = Math.round((votantes * calculateSampleSize(totalVotantes, errosRelativos[0])) / totalVotantes);
            const entrevistas5 = Math.round((votantes * calculateSampleSize(totalVotantes, errosRelativos[1])) / totalVotantes);
            const entrevistas6 = Math.round((votantes * calculateSampleSize(totalVotantes, errosRelativos[2])) / totalVotantes);

            totalEntrevistas4 += entrevistas4;
            totalEntrevistas5 += entrevistas5;
            totalEntrevistas6 += entrevistas6;

            const row = document.createElement('tr');
            const fields = [
                bairro, 
                votantes, 
                entrevistas4, 
                entrevistas5, 
                entrevistas6
            ];
            fields.forEach(field => {
                const td = document.createElement('td');
                td.textContent = field;
                row.appendChild(td);
            });
            table.appendChild(row);
        });

        const totalRow = document.createElement('tr');
        const totalFields = [
            'Total', 
            totalVotantes, 
            totalEntrevistas4, 
            totalEntrevistas5, 
            totalEntrevistas6
        ];
        totalFields.forEach(field => {
            const td = document.createElement('td');
            td.textContent = field;
            totalRow.appendChild(td);
        });
        table.appendChild(totalRow);

        planoAmostralDiv.appendChild(table);
    }
});