
$(document).ready(function() {
    const feedbackInput = $('#feedbackInput');
    const submitFeedback = $('#submitFeedback');
    const feedbackResponse = $('#feedbackResponse');

    submitFeedback.click(() => {
        const feedback = feedbackInput.val();
        if (feedback) {
            processFeedback(feedback);
        } else {
            alert('Please enter your feedback before submitting.');
        }
    });

    async function processFeedback(feedback) {
        const API_KEY = 'AIzaSyDPdIiA9uFLZXG8s92ankQzOLyQAOO-DEo';
        const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

        const requestBody = {
            contents: [{
                parts: [{
                    text: `Convert the following user feedback for LEXI Readease into formal language, suitable for a professional email:\n\n${feedback}`
                }]
            }]
        };

        try {
            submitFeedback.prop('disabled', true).text('Processing...');
            
            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            const formalFeedback = data.candidates[0].content.parts[0].text;

            // Simulate sending email
            sendEmail(formalFeedback);

            feedbackResponse.html(`
                <h4>Thank you for your feedback</h4>
                <p>Your feedback has been formalized and sent to our team. Here's what we sent:</p>
                <pre>${formalFeedback}</pre>
            `);
        } catch (error) {
            console.error('Error:', error);
            feedbackResponse.html(`
                <h4>Error</h4>
                <p>An error occurred while processing your feedback. Please try again later.</p>
            `);
        } finally {
            submitFeedback.prop('disabled', false).text('Submit Feedback');
        }
    }

    function sendEmail(formalFeedback) {
        // This is a simulation of sending an email
        // In a real application, you would use a backend service to send emails
        console.log('Simulating email send to flashwebby4@gmail.com');
        console.log('Email content:');
        console.log(formalFeedback);
        
        // You could make an AJAX call to your backend here if you implement email sending
        // $.post('/send-email', { to: 'flashwebby4@gmail.com', content: formalFeedback });
    }
});