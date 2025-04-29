const sendSlackError = async (message) => {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;

    try {
        await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: ` *ERROR 5XX DETECTADO:*\n${message}` })
        });
    } catch (err) {
        console.error("Fallo enviando error a Slack:", err.message);
    }
};

module.exports = { sendSlackError };
