// Sélection des éléments du DOM
const display = document.querySelector(".display");
const buttons = document.querySelectorAll(".keyboard button");

// Variables d'état principales de la calculatrice
let currentInput = "0"; // Valeur actuellement affichée
let firstOperand = null; // Premier opérande (utilisé lors d’une opération)
let operator = null; // Opérateur sélectionné (+, -, etc.)
let waitingForSecondOperand = false; // Indique si on attend le deuxième nombre

// Ajout des écouteurs d'événements sur chaque bouton
buttons.forEach((button) => {
  button.addEventListener("click", () => handleButtonClick(button));
});

// Affiche la valeur initiale au démarrage
updateDisplay();

/**
 * Gère le clic sur un bouton de la calculatrice.
 * Détermine le type de bouton (nombre, point, opérateur, etc.)
 * et délègue le traitement à la fonction appropriée.
 */
function handleButtonClick(button) {
  const keyValue = button.dataset.key; // Récupère la valeur associée au bouton

  if (keyValue === "=") handleEqualInput();
  else if (button.classList.contains("btn-ca")) clearAll();
  else if (button.classList.contains("btn-c")) clear();
  else if (button.classList.contains("btn-number"))
    handleNumberInput(keyValue); // Gestion des chiffres
  else if (button.classList.contains("btn-dot"))
    handleDotInput(keyValue); // Gestion du point décimal
  else if (button.classList.contains("btn-operator") && keyValue !== "=" && keyValue !== "%")
    // Gestion des opérateurs exepté '='
    handleOperatorInput(keyValue);
  else if (keyValue === "%") handlePercentInput();

  updateDisplay(); // Met à jour l’écran après chaque action
}

/**
 * Met à jour le contenu de l’écran avec la valeur courante.
 */
function updateDisplay() {
  display.textContent = currentInput;
}

/**
 * Gère l'entrée des chiffres.
 * - Remplace le zéro initial si besoin.
 * - Concatène les chiffres pour former un nombre complet.
 * - Réinitialise correctement l’état si on attendait un second opérande.
 */
function handleNumberInput(keyValue) {
  if (waitingForSecondOperand) {
    // Si on vient de saisir un opérateur, on démarre un nouveau nombre
    currentInput = keyValue;
    waitingForSecondOperand = false;
  } else if (currentInput === "0" && keyValue === "0") {
    currentInput = "0"; // Évite plusieurs zéros consécutifs au début
  } else if (currentInput === "0") {
    currentInput = keyValue; // Remplace le zéro initial
  } else {
    currentInput += keyValue; // Ajoute le chiffre à la fin du nombre courant
  }

  console.log(currentInput); // (Debug) Affiche la valeur courante dans la console
}

/**
 * Gère l'entrée du point décimal.
 * - Si on attend un second opérande, commence un nouveau nombre avec '0.'
 * - Empêche d’ajouter plusieurs points dans le même nombre.
 */
function handleDotInput(keyValue) {
  if (waitingForSecondOperand) {
    currentInput = "0."; // Démarre un nouveau nombre décimal
    waitingForSecondOperand = false; // Sort de l’état d’attente
  }

  if (!currentInput.includes("."))
    // Empêche les doublons de point
    currentInput += keyValue;
}

/**
 * Gère la saisie d'un opérateur (+, -, *, /)
 */
function handleOperatorInput(nextOperator) {
  const inputValue = parseFloat(currentInput);

  // Si firstOperand est null, c'est le début d'une nouvelle chaîne de calcul
  if (firstOperand === null) {
    firstOperand = inputValue;
  } else if (operator) {
    // Si un opérateur précédent existe, effectuer le calcul
    const result = performCalculation(firstOperand, inputValue, operator);
    // Gérer les erreurs de calcul (ex: division par zéro)
    if (result === "Error") {
      currentInput = "Error";
      firstOperand = null;
      operator = null;
      waitingForSecondOperand = true;
      updateDisplay(); // Important pour afficher l'erreur immédiatement
      return; // Arrêter le traitement
    }
    currentInput = result.toString(); // Afficher le résultat intermédiaire
    firstOperand = result; // Le résultat devient le nouveau premier opérande
  }

  waitingForSecondOperand = true; // Attendre le second opérande pour le nouvel opérateur
  operator = nextOperator; // Stocker le nouvel opérateur
}

/**
 * Réinitialise l'état interne de la calculatrice
 * Met à zéro ou null toutes les variables importantes :
 * - currentInput : affichage courant
 * - firstOperand : premier opérande
 * - operator : opérateur actif
 * - waitingForSecondOperand : indique si on attend le second opérande
 */
function resetState() {
  currentInput = "0";
  firstOperand = null;
  operator = null;
  waitingForSecondOperand = false;
}

/**
 * Gère le clic sur le bouton '='
 * Fonction principale pour effectuer le calcul lorsqu'un utilisateur
 * clique sur '='. Elle prend en compte :
 * - l'absence de premier opérande ou d'opérateur
 * - l'état 'Error'
 * - la conversion des valeurs affichées en nombres
 * - la gestion des erreurs (division par zéro)
 * - la mise à jour de currentInput et des états de la calculatrice
 */
function handleEqualInput() {
  // Si pas de premier opérande ou pas d'opérateur, on ne fait rien
  if (firstOperand === null || operator === null) {
    return;
  }

  if (currentInput === "Error") {
    resetState();
    return;
  }

  const secondOperand = parseFloat(currentInput); // Le nombre actuellement affiché est le second opérande

  // Effectuer l'opération
  const result = performCalculation(firstOperand, secondOperand, operator);

  // Gérer les erreurs (ex: division par zéro)
  if (result === "Error") {
    resetState();
    currentInput = "Error";
    waitingForSecondOperand = true; // Le prochain chiffre remplacera l'affichage
    return;
  }

  currentInput = result.toString(); // Afficher le résultat
  firstOperand = null; // Réinitialiser firstOperand
  waitingForSecondOperand = true; // Le prochain chiffre remplacera le résultat
}

/**
 * Effectue un calcul arithmétique entre deux nombres selon l'opérateur.
 * @param {number} num1 - Premier opérande.
 * @param {number} num2 - Second opérande.
 * @param {string} operator - Opérateur : '+', '-', '*', '/'.
 * @returns {number|string} Résultat du calcul ou 'Error' si division par zéro.
 */
function performCalculation(num1, num2, operator) {
  if (!Number.isFinite(num1) || !Number.isFinite(num2)) {
    return "Error";
  }

  let result;

  switch (operator) {
    case "+":
      result = num1 + num2;
      break;
    case "-":
      result = num1 - num2;
      break;
    case "*":
      result = num1 * num2;
      break;
    case "/":
      result = num2 !== 0 ? num1 / num2 : "Error";
      break;
    default:
      result = "Error";
      break;
  }

  return result;
}

/**
 * Réinitialise complètement l'état de la calculatrice.
 *
 * Appelle la fonction resetState() pour remettre à zéro :
 * - l'entrée courante,
 * - le premier opérande,
 * - l'opérateur,
 * - et le flag d'attente du second opérande.
 */
function clearAll() {
  // Appelle de la fonction resetState()
  resetState();
}

/**
 * Efface uniquement l'entrée courante sans modifier le reste de l'état.
 *
 * Utilisé pour le bouton "C" : permet de recommencer la saisie du nombre
 * sans perdre le calcul ou l'opération en cours.
 */
function clear() {
  currentInput = "0";
}

/**
 * Calcule la valeur d'un pourcentage relatif.
 *
 * Exemple : calculatePercent(200, 10) → 20
 *  - base : valeur de référence (ex. 200)
 *  - value : pourcentage à appliquer (ex. 10)
 *
 * @param {number} base - La valeur de base sur laquelle calculer le pourcentage.
 * @param {number} value - Le pourcentage à appliquer.
 * @returns {number} La valeur correspondant au pourcentage de la base.
 */
function calculatePercent(base, value) {
  return (base / 100) * value;
}

/**
 * Gère la logique du bouton '%'
 * - Cas avec opérateur : calcul relatif (ex. 200 + 10% = 220)
 * - Cas sans opérateur : convertit en pourcentage (ex. 50% = 0.5)
 */
function handlePercentInput() {
  let percent = 0;
  let firstOp = parseFloat(firstOperand);
  let current = parseFloat(currentInput);

  // Culcul du pourcentage
  if (firstOperand !== null && operator !== null) {
    percent = calculatePercent(firstOp, current);
  }

  //  Application résultat selon l'opérateur
  switch (operator) {
    case "+":
      currentInput = performCalculation(firstOp, percent, operator).toString();
      break;
    case "-":
      currentInput = performCalculation(firstOp, percent, operator).toString();
      break;
    case "*":
      currentInput = percent.toString();
      break;
    case "/":
      if (current !== 0) {
        currentInput = ((firstOp / current) * 100).toString();
      } else {
        currentInput = "Error";
      }
      break;
    default:
      currentInput = (current / 100).toString();
      break;
  }

  // Mise à jour d'état
  firstOperand = null;
  waitingForSecondOperand = true;
}
