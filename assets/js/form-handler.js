document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("contact-form");
    const formMessage = document.getElementById("form-message");

    form.addEventListener("submit", function(event) {
        event.preventDefault(); // Останавливаем стандартное поведение формы

        const xhr = new XMLHttpRequest();
        xhr.open("POST", form.action);
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    formMessage.style.display = "block"; // Показываем сообщение
                    formMessage.textContent = "Thank you for your message.";
                    form.reset(); // Сбрасываем форму
                } else {
                    console.error("Error submitting the form: ", xhr.responseText);
                    alert("Oops! There was a problem submitting your form");
                }
            }
        };

        xhr.onerror = function() {
            console.error("Network error");
            alert("Oops! There was a problem submitting your form due to a network error.");
        };

        const formData = new FormData(form);
        xhr.send(formData);
    });
});
