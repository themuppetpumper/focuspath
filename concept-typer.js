// Concept Typer Game
const concepts = [
  { term: 'Osmosis', definition: 'Movement of water molecules through a semipermeable membrane.' },
  { term: 'Photosynthesis', definition: 'Process by which green plants use sunlight to synthesize food.' },
  { term: 'Mitosis', definition: 'Type of cell division resulting in two daughter cells.' },
  { term: 'Gravity', definition: 'Force that attracts a body toward the center of the earth.' },
  { term: 'Evaporation', definition: 'Process of turning from liquid into vapor.' },
  { term: 'Atom', definition: 'Basic unit of a chemical element.' },
  { term: 'Ecosystem', definition: 'Community of interacting organisms and their environment.' },
  { term: 'Velocity', definition: 'Speed of something in a given direction.' },
  { term: 'Hypothesis', definition: 'Proposed explanation made on the basis of limited evidence.' },
  { term: 'Diffusion', definition: 'Spreading of something more widely.' }
];

let current = 0;
let startTime = 0;
let correct = 0;
let total = 0;
let times = [];

function showConcept() {
  document.getElementById('typer-word').textContent = concepts[current].definition;
  document.getElementById('typer-input').value = '';
  document.getElementById('typer-result').textContent = '';
  document.getElementById('typer-next').style.display = 'none';
  document.getElementById('typer-input').disabled = false;
  document.getElementById('typer-input').focus();
  startTime = Date.now();
}

function showStats() {
  let avg = times.length ? (times.reduce((a,b)=>a+b,0)/times.length/1000).toFixed(2) : 0;
  document.getElementById('typer-stats').textContent = `Accuracy: ${correct}/${total} | Avg Time: ${avg}s`;
}

function checkInput(e) {
  if (e.key === 'Enter') {
    let input = document.getElementById('typer-input').value.trim();
    let answer = concepts[current].term;
    total++;
    let timeTaken = Date.now() - startTime;
    times.push(timeTaken);
    if (input.toLowerCase() === answer.toLowerCase()) {
      correct++;
      document.getElementById('typer-result').textContent = 'Correct!';
    } else {
      document.getElementById('typer-result').textContent = `Incorrect. The answer was: ${answer}`;
    }
    document.getElementById('typer-input').disabled = true;
    document.getElementById('typer-next').style.display = 'inline-block';
    showStats();
  }
}

function nextConcept() {
  current++;
  if (current >= concepts.length) {
    document.getElementById('typer-word').textContent = 'Game Over!';
    document.getElementById('typer-input').style.display = 'none';
    document.getElementById('typer-next').style.display = 'none';
    document.getElementById('typer-result').textContent = `Final Accuracy: ${correct}/${total}`;
    showStats();
    return;
  }
  showConcept();
}

document.getElementById('typer-input').addEventListener('keydown', checkInput);
document.getElementById('typer-next').addEventListener('click', nextConcept);

showConcept();
showStats();
