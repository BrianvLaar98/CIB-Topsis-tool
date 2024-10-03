
let descriptors = [];
let variants = {};
let pairwiseMatrix = [];
let normalizedWeights = [];

// Add descriptor
function addDescriptor() {
  const descriptorInput = document.getElementById('descriptorInput').value;
  if (descriptorInput !== "") {
    descriptors.push(descriptorInput);
    document.getElementById('descriptorInput').value = '';
    updateDescriptorList();
    updateDescriptorSelect();
    updatePairwiseTable();
  }
}

// Update descriptor list
function updateDescriptorList() {
  const list = document.getElementById('descriptorList');
  list.innerHTML = '';
  descriptors.forEach((descriptor, index) => {
    list.innerHTML += `<li>${descriptor}</li>`;
  });
}

// Add variant for a selected descriptor
function addVariant() {
  const descriptor = document.getElementById('descriptorSelect').value;
  const variant = document.getElementById('variantInput').value;
  if (!variants[descriptor]) variants[descriptor] = [];
  if (variant !== "") {
    variants[descriptor].push(variant);
    document.getElementById('variantInput').value = '';
    updateVariantList(descriptor);
  }
}

// Update descriptor select dropdown
function updateDescriptorSelect() {
  const select = document.getElementById('descriptorSelect');
  select.innerHTML = '';
  descriptors.forEach(descriptor => {
    select.innerHTML += `<option value="${descriptor}">${descriptor}</option>`;
  });
}

// Update variant list for the selected descriptor
function updateVariantList(descriptor) {
  const list = document.getElementById('variantList');
  list.innerHTML = '';
  variants[descriptor].forEach((variant, index) => {
    list.innerHTML += `<li>${variant}</li>`;
  });
}

// Update pairwise comparison table
function updatePairwiseTable() {
  const table = document.getElementById('pairwiseTable');
  table.innerHTML = '';

  if (descriptors.length < 2) return;

  let header = '<tr><th>Descriptors</th>';
  descriptors.forEach(descriptor => header += `<th>${descriptor}</th>`);
  header += '</tr>';
  table.innerHTML += header;

  descriptors.forEach((rowDesc, rowIndex) => {
    let row = `<tr><td>${rowDesc}</td>`;
    descriptors.forEach((colDesc, colIndex) => {
      if (rowIndex === colIndex) {
        row += `<td>1</td>`;
      } else if (rowIndex < colIndex) {
        row += `<td><input type="number" id="p${rowIndex}-${colIndex}" min="1" max="9" value="1"></td>`;
      } else {
        row += `<td id="p${rowIndex}-${colIndex}"></td>`;
      }
    });
    row += '</tr>';
    table.innerHTML += row;
  });
}

// Calculate weights using AHP (Eigenvector method)
function calculateWeights() {
  pairwiseMatrix = [];
  const n = descriptors.length;

  // Create matrix from user inputs
  for (let i = 0; i < n; i++) {
    pairwiseMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        pairwiseMatrix[i][j] = 1;
      } else if (i < j) {
        pairwiseMatrix[i][j] = parseFloat(document.getElementById(`p${i}-${j}`).value);
      } else {
        pairwiseMatrix[i][j] = 1 / pairwiseMatrix[j][i];
        document.getElementById(`p${i}-${j}`).innerText = (1 / pairwiseMatrix[j][i]).toFixed(2);
      }
    }
  }

  // Sum rows and normalize to get weights
  let sumColumns = Array(n).fill(0);
  pairwiseMatrix.forEach(row => row.forEach((val, index) => sumColumns[index] += val));
  
  let normalizedMatrix = pairwiseMatrix.map(row => row.map((val, index) => val / sumColumns[index]));

  // Calculate average for each row to get normalized weights
  normalizedWeights = normalizedMatrix.map(row => row.reduce((a, b) => a + b, 0) / n);
  
  let result = `<h4>Normalized Weights:</h4><ul>`;
  descriptors.forEach((desc, index) => {
    result += `<li>${desc}: ${normalizedWeights[index].toFixed(2)}</li>`;
  });
  result += `</ul>`;
  document.getElementById('weightResult').innerHTML = result;
}

// Implementing a basic TOPSIS calculation
function calculateTopsis() {
  if (!Object.keys(variants).length) {
    document.getElementById('topsisResult').innerHTML = 'Please add descriptors and variants first.';
    return;
  }

  // Dummy data for cross-impact values (since we don't have matrix input yet)
  let scenarios = [
    {name: "Scenario 1", values: [0.7, 0.8, 0.9]},
    {name: "Scenario 2", values: [0.6, 0.9, 0.7]},
    {name: "Scenario 3", values: [0.8, 0.7, 0.6]}
  ];

  // Calculate ideal and negative ideal solutions
  let idealSolution = [];
  let negativeIdealSolution = [];
  
  for (let i = 0; i < descriptors.length; i++) {
    let values = scenarios.map(s => s.values[i]);
    idealSolution.push(Math.max(...values));
    negativeIdealSolution.push(Math.min(...values));
  }

  // Calculate Euclidean distance from ideal and negative ideal
  scenarios.forEach(scenario => {
    let dPositive = 0, dNegative = 0;
    for (let i = 0; i < descriptors.length; i++) {
      dPositive += Math.pow((idealSolution[i] - scenario.values[i]) * normalizedWeights[i], 2);
      dNegative += Math.pow((scenario.values[i] - negativeIdealSolution[i]) * normalizedWeights[i], 2);
    }
    scenario.positiveDistance = Math.sqrt(dPositive);
    scenario.negativeDistance = Math.sqrt(dNegative);
    scenario.performanceScore = scenario.negativeDistance / (scenario.positiveDistance + scenario.negativeDistance);
  });

  // Rank scenarios
  scenarios.sort((a, b) => b.performanceScore - a.performanceScore);

  // Display the results
  let result = `<h4>Scenario Ranking (TOPSIS):</h4><ul>`;
  scenarios.forEach(scenario => {
    result += `<li>${scenario.name}: ${scenario.performanceScore.toFixed(2)}</li>`;
  });
  result += `</ul>`;
  document.getElementById('topsisResult').innerHTML = result;
}
