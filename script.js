document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const messagesContainer = document.getElementById('messagesContainer');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    const emojiBtn = document.getElementById('emojiBtn');
    const emojiPicker = document.getElementById('emojiPicker');
    const emojiGrid = document.querySelector('.emoji-grid');

    // Attachment Elements
    const attachmentPreview = document.getElementById('attachmentPreview');
    const previewImage = document.getElementById('previewImage');
    const previewFile = document.getElementById('previewFile');
    const previewFileName = document.getElementById('previewFileName');
    const removeAttachmentBtn = document.getElementById('removeAttachmentBtn');

    let currentAttachment = null;

    // Theme Toggle Logic
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const icon = themeToggle.querySelector('i');
        if (body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    // Auto-scroll to bottom of chat
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    scrollToBottom();

    // Function to create a new message element
    function createMessageElement(content, type, isHtml = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');

        if (isHtml) {
            messageContent.innerHTML = content;
        } else {
            messageContent.textContent = content;
        }

        const messageTime = document.createElement('span');
        messageTime.classList.add('message-time');

        const now = new Date();
        messageTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);

        return messageDiv;
    }

    // Function to handle sending a message
    function sendMessage() {
        const content = messageInput.value.trim();

        // Don't send if both content and attachment are empty
        if (content === '' && !currentAttachment) return;

        // Create message container
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'sent');

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');

        // Handle Attachment
        if (currentAttachment) {
            if (currentAttachment.type.startsWith('image/')) {
                const imgHtml = `<img src="${previewImage.src}" alt="Uploaded Image" class="attachment-preview">`;
                messageContent.innerHTML += imgHtml;
            } else if (currentAttachment.type === 'application/pdf') {
                const pdfHtml = `
                    <div class="file-attachment">
                        <i class="fa-solid fa-file-pdf file-icon"></i>
                        <span class="file-name">${currentAttachment.name}</span>
                    </div>
                `;
                messageContent.innerHTML += pdfHtml;
            }
        }

        // Handle Text
        if (content !== '') {
            if (currentAttachment) {
                const textDiv = document.createElement('div');
                textDiv.style.marginTop = '8px';
                textDiv.textContent = content;
                messageContent.appendChild(textDiv);
            } else {
                messageContent.textContent = content;
            }
        }

        const messageTime = document.createElement('span');
        messageTime.classList.add('message-time');
        const now = new Date();
        messageTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        messagesContainer.appendChild(messageDiv);

        // Clear input and attachment
        messageInput.value = '';
        clearAttachment();
        scrollToBottom();

        // Simulate receiving a reply
        setTimeout(() => {
            const replies = [
                "That's interesting!",
                "Can you tell me more?",
                "I agree with you.",
                "Let's catch up later.",
                "Cool!",
                "Got it, thanks.",
                "I'm here to help!",
                "Tell me more about that."
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            const replyMessage = createMessageElement(randomReply, 'received');
            messagesContainer.appendChild(replyMessage);
            scrollToBottom();
        }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
    }

    // File Attachment Logic
    attachBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        currentAttachment = file;
        attachmentPreview.style.display = 'flex';

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewImage.src = event.target.result;
                previewImage.style.display = 'block';
                previewFile.style.display = 'none';
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            previewImage.style.display = 'none';
            previewFile.style.display = 'flex';
            previewFileName.textContent = file.name;
        }

        // Reset file input so same file can be selected again
        fileInput.value = '';
        messageInput.focus();
    });

    removeAttachmentBtn.addEventListener('click', () => {
        clearAttachment();
    });

    function clearAttachment() {
        currentAttachment = null;
        attachmentPreview.style.display = 'none';
        previewImage.src = '';
        previewFileName.textContent = '';
    }

    // Emoji Picker Logic
    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPicker.classList.toggle('active');
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
            emojiPicker.classList.remove('active');
        }
    });

    // Add emoji to input
    emojiGrid.addEventListener('click', (e) => {
        if (e.target.tagName === 'SPAN') {
            messageInput.value += e.target.textContent;
            messageInput.focus();
        }
    });

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
