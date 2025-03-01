// Sample questions array with answer options and associated personality values
const questions = [
    {
      question: "How do you prefer to spend your free time?",
      options: [
        { text: "Reading a book", value: "introvert" },
        { text: "Attending a social event", value: "extrovert" },
        { text: "Trying a new hobby", value: "balanced" },
        { text: "Exercising outdoors", value: "active" }
      ]
    },
    {
      question: "In group projects, what role do you take on?",
      options: [
        { text: "Taking the lead", value: "leader" },
        { text: "Supporting the team", value: "supportive" },
        { text: "Generating creative ideas", value: "creative" },
        { text: "Balancing ideas and action", value: "balanced" }
      ]
    },
    // Add more questions as needed
  ];
  
  let currentQuestionIndex = 0;
  let personalityScores = {
    introvert: 0,
    extrovert: 0,
    balanced: 0,
    active: 0,
    leader: 0,
    supportive: 0,
    creative: 0
  };
  
  // DOM Elements
  const questionTitleEl = document.getElementById('question-title');
  const answerOptionsEl = document.getElementById('answer-options');
  const nextBtn = document.getElementById('next-btn');
  const resultsSection = document.getElementById('results');
  const testSection = document.getElementById('test');
  const evaluationEl = document.getElementById('evaluation');
  const recommendationsEl = document.getElementById('recommendations');
  const restartBtn = document.getElementById('restart-btn');
  
  // Function to display the current question
  function displayQuestion() {
    // Clear previous answer options
    answerOptionsEl.innerHTML = "";
    
    const currentQuestion = questions[currentQuestionIndex];
    questionTitleEl.textContent = currentQuestion.question;
    
    // Create and append answer options
    currentQuestion.options.forEach(option => {
      const li = document.createElement('li');
      li.textContent = option.text;
      li.dataset.value = option.value;
      li.addEventListener('click', selectAnswer);
      answerOptionsEl.appendChild(li);
    });
  }
  
  // Function to handle answer selection
  function selectAnswer(e) {
    // Remove 'selected' class from all options
    const options = answerOptionsEl.querySelectorAll('li');
    options.forEach(option => {
      option.classList.remove('selected');
    });
    
    // Add 'selected' class to the clicked option
    e.target.classList.add('selected');
  }
  
  // Event listener for the Next button
  nextBtn.addEventListener('click', () => {
    const selectedOption = answerOptionsEl.querySelector('.selected');
    if (!selectedOption) {
      alert("Please select an answer before proceeding.");
      return;
    }
    
    // Update the personality score based on the selected answer
    const selectedValue = selectedOption.dataset.value;
    if (personalityScores[selectedValue] !== undefined) {
      personalityScores[selectedValue]++;
    }
    
    currentQuestionIndex++;
    
    // Check if there are more questions
    if (currentQuestionIndex < questions.length) {
      displayQuestion();
    } else {
      evaluateResults();
    }
  });
  
  // Restart the test
  restartBtn.addEventListener('click', () => {
    currentQuestionIndex = 0;
    // Reset scores
    for (let key in personalityScores) {
      personalityScores[key] = 0;
    }
    resultsSection.classList.add('hidden');
    testSection.classList.remove('hidden');
    displayQuestion();
  });
  
  // Function to evaluate and display the results with creative personality type names and descriptions
  function evaluateResults() {
    testSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    // Determine the personality type with the highest score
    let maxScore = 0;
    let personalityType = '';
    for (let type in personalityScores) {
      if (personalityScores[type] > maxScore) {
        maxScore = personalityScores[type];
        personalityType = type;
      }
    }
    
    // Prepare custom names and detailed descriptions for each personality type
    let evaluationText = "";
    let recommendationText = "";
    
    switch(personalityType) {
      case 'introvert':
        evaluationText = "The Reflective Sage";
        recommendationText = 
          "You are introspective and value solitude, finding depth in quiet moments. " +
          "Strengths: Thoughtful, insightful, and capable of deep connections. " +
          "Areas to work on: Expressing your inner thoughts more openly. " +
          "Compatibility: You often resonate well with The Harmonizer and The Nurturing Companion.";
        break;
      case 'extrovert':
        evaluationText = "The Social Dynamo";
        recommendationText = 
          "You thrive in social settings and draw energy from interactions. " +
          "Strengths: Outgoing, energetic, and a natural communicator. " +
          "Areas to work on: Balancing your need for social interaction with some quiet time. " +
          "Compatibility: You’re a great match for The Visionary Leader and The Energetic Explorer.";
        break;
      case 'balanced':
        evaluationText = "The Harmonizer";
        recommendationText = 
          "You strike a beautiful balance between introspection and sociability. " +
          "Strengths: Adaptable, well-rounded, and able to see multiple perspectives. " +
          "Areas to work on: Occasionally, you might feel pulled in different directions. " +
          "Compatibility: You often find common ground with The Reflective Sage and The Innovative Creator.";
        break;
      case 'active':
        evaluationText = "The Energetic Explorer";
        recommendationText = 
          "Your dynamic nature and love for adventure push you to seek new experiences. " +
          "Strengths: Adventurous, enthusiastic, and highly energetic. " +
          "Areas to work on: Sometimes a bit impulsive—try to plan a bit more. " +
          "Compatibility: Your energy aligns well with The Social Dynamo and The Visionary Leader.";
        break;
      case 'leader':
        evaluationText = "The Visionary Leader";
        recommendationText = 
          "You naturally take charge and inspire those around you with a clear vision. " +
          "Strengths: Decisive, ambitious, and an excellent motivator. " +
          "Areas to work on: Consider balancing assertiveness with collaboration. " +
          "Compatibility: You often partner effectively with The Social Dynamo and The Energetic Explorer.";
        break;
      case 'supportive':
        evaluationText = "The Nurturing Companion";
        recommendationText = 
          "Your empathy and willingness to support others make you a trusted friend. " +
          "Strengths: Compassionate, reliable, and an excellent listener. " +
          "Areas to work on: Remember to care for yourself, too. " +
          "Compatibility: You tend to click with The Reflective Sage and The Harmonizer.";
        break;
      case 'creative':
        evaluationText = "The Innovative Creator";
        recommendationText = 
          "Your imagination and originality are your greatest assets, always brimming with new ideas. " +
          "Strengths: Imaginative, resourceful, and inventive. " +
          "Areas to work on: Paying attention to practical details can help turn ideas into reality. " +
          "Compatibility: Your creativity often finds a match with The Harmonizer and The Nurturing Companion.";
        break;
      default:
        evaluationText = "A Unique Personality";
        recommendationText = "Your personality is truly one-of-a-kind! Continue exploring your interests and strengths.";
    }
    
    evaluationEl.textContent = evaluationText;
    recommendationsEl.textContent = recommendationText;
  }
  
  // Initialize the first question when the page loads
  displayQuestion();
  n();
  