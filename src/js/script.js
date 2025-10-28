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

  if (button.classList.contains("btn-number"))
    handleNumberInput(keyValue); // Gestion des chiffres
  else if (button.classList.contains("btn-dot"))
    handleDotInput(keyValue); // Gestion du point décimal
  else if (button.classList.contains("btn-operator") && keyValue !== "=")
    // Gestion des opérateurs exepté '='
    handleOperatorInput(keyValue);
  else if (keyValue === "=") handleEqualInput();

  updateDisplay(); // Met à jour l’écran après chaque action

  console.log("firstoperand: " + firstOperand);
  console.log("currentInput: " + currentInput);
  console.log("waiting: " + waitingForSecondOperand);
  console.log("********************");
  console.log(" ");
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
 * - Si on attend un second opérande, commence un nouveau nombre avec "0."
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
 *
 * Gère l'entrée des opérateurs
 */
function handleOperatorInput(nextoperator) {
  firstOperand = currentInput;
  waitingForSecondOperand = true;
  operator = nextoperator;
}

/**
 * Effectue un calcul arithmétique entre deux nombres en fonction de l'opérateur fourni.
 *
 * @param {number} num1 - Le premier opérande (gauche).
 * @param {number} num2 - Le second opérande (droite).
 * @param {string} operator - L'opérateur à appliquer : "+", "-", "*", "/".
 * @returns {number|string} Le résultat du calcul.
 *          Retourne "Error" si division par zéro.
 *          Si l'opérateur n'est pas reconnu, renvoie num2.
 *
 * @example
 * performCalculation(2, 3, "+"); // renvoie 5
 * performCalculation(10, 2, "/"); // renvoie 5
 * performCalculation(10, 0, "/"); // renvoie "Error"
 */
function performCalculation(num1, num2, operator) {
  let result = 0;

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
      result = num2 !== 0 ? num1 / num2 : NaN;
      break;
    default:
      // Si l'opérateur n'est pas reconnu, on renvoie num2 par défaut
      result = num2;
      break;
  }

  return result;
}
