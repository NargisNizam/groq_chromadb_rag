const questionInput = document.getElementById("question");
const sendBtn = document.getElementById("sendBtn");
const chatBox = document.getElementById("chatBox");
const clearBtn = document.getElementById("clearBtn");
const charCount = document.getElementById("charCount");


/* Character Counter */

questionInput.addEventListener("input", () => {

    const length = questionInput.value.length;

    charCount.textContent =
        `${length} characters`;

});


/* Add Message */

function addMessage(message, type) {

    const wrapper = document.createElement("div");

    wrapper.className =
        `message ${type}`;


    const avatar = document.createElement("div");

    avatar.className = "avatar";

    avatar.textContent =
        type === "user"
            ? "YOU"
            : "AI";


    const bubble = document.createElement("div");

    bubble.className = "bubble";


    const text = document.createElement("p");

    text.textContent = message;


    bubble.appendChild(text);

    wrapper.appendChild(avatar);

    wrapper.appendChild(bubble);

    chatBox.appendChild(wrapper);


    chatBox.scrollTop =
        chatBox.scrollHeight;
}


/* Loading */

function addLoading() {

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message bot";

    wrapper.id =
        "loadingMessage";


    wrapper.innerHTML = `
        <div class="avatar">AI</div>

        <div class="bubble">

            <div class="loading">

                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>

            </div>

        </div>
    `;


    chatBox.appendChild(wrapper);

    chatBox.scrollTop =
        chatBox.scrollHeight;
}


/* Remove Loading */

function removeLoading() {

    const loading =
        document.getElementById(
            "loadingMessage"
        );


    if (loading) {
        loading.remove();
    }
}


/* Ask Question */

async function askQuestion() {

    const question =
        questionInput.value.trim();


    if (!question) {

        alert(
            "Please enter a question."
        );

        return;
    }


    addMessage(
        question,
        "user"
    );


    questionInput.value = "";

    charCount.textContent =
        "0 characters";


    sendBtn.disabled = true;

    addLoading();


    try {

        const response =
            await fetch(
                "/rag/query",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        question: question,
                        top_k: 5
                    })
                }
            );


        const data =
            await response.json();


        removeLoading();


        if (!response.ok) {

            const errorMessage =
                data.detail ||
                "Something went wrong.";


            addMessage(
                `Error: ${errorMessage}`,
                "bot"
            );

            return;
        }


        let answer = "";


        if (
            typeof data === "string"
        ) {

            answer = data;

        } else {

            answer =
                data.answer ||
                data.response ||
                data.result ||
                data.output ||
                JSON.stringify(
                    data,
                    null,
                    2
                );

        }


        addMessage(
            answer,
            "bot"
        );


    } catch (error) {

        console.error(
            "API Error:",
            error
        );


        removeLoading();


        addMessage(
            "Unable to connect to the API. Please make sure the FastAPI server is running.",
            "bot"
        );


    } finally {

        sendBtn.disabled = false;

        questionInput.focus();

    }
}


/* Send Button */

sendBtn.addEventListener(
    "click",
    askQuestion
);


/* Enter Key */

questionInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            askQuestion();

        }

    }
);


/* Clear Chat */

clearBtn.addEventListener(
    "click",
    () => {

        chatBox.innerHTML = `
            <div class="message bot">

                <div class="avatar">
                    AI
                </div>

                <div class="bubble">

                    <p>
                        Chat cleared.
                        Ask me a new question! 👋
                    </p>

                </div>

            </div>
        `;

    }
);
