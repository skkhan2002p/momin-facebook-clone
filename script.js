document.addEventListener('DOMContentLoaded', () => {
    const postInput = document.getElementById('post-input');
    const submitPostBtn = document.getElementById('submit-post');
    const postsContainer = document.getElementById('posts-container');

    // Default local posts fallback
    let localPosts = [
        {
            id: 'default-1',
            author: 'Momin Hessen',
            content: 'Welcome to my social space! Feel free to share your thoughts here. 🚀',
            time: 'Just now',
            likes: 1,
            likedByMe: false
        }
    ];

    async function loadPosts() {
        if (window.MayaDB) {
            try {
                const res = await MayaDB.list('posts', { limit: 20 });
                if (res && res.length > 0) {
                    renderPosts(res.map(item => ({ id: item.id, ...item.data })));
                    return;
                }
            } catch (e) {
                console.log('MayaDB list error, using local fallback', e);
            }
        }
        renderPosts(localPosts);
    }

    function renderPosts(posts) {
        postsContainer.innerHTML = '';
        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'card post-card';
            card.innerHTML = `
                <div class="post-header">
                    <div class="profile-pic-sm">MH</div>
                    <div>
                        <h4 class="post-author">${escapeHtml(post.author || 'Momin Hessen')}</h4>
                        <span class="post-time">${escapeHtml(post.time || 'Recently')}</span>
                    </div>
                </div>
                <div class="post-body">
                    ${escapeHtml(post.content)}
                </div>
                <div class="post-footer">
                    <button class="like-btn" data-id="${post.id}">👍 Like (${post.likes || 0})</button>
                    <button class="comment-btn">💬 Comment</button>
                </div>
            `;
            postsContainer.appendChild(card);
        });

        // Add like event listeners
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (window.MayaDB) {
                    try {
                        await MayaDB.inc('posts', id, 'likes', 1);
                        loadPosts();
                        return;
                    } catch (err) {
                        console.log('Like inc error', err);
                    }
                }
                // Fallback local increment
                const p = localPosts.find(item => item.id === id);
                if (p) {
                    p.likes = (p.likes || 0) + 1;
                    renderPosts(localPosts);
                }
            });
        });
    }

    async function handleCreatePost() {
        const text = postInput.value.trim();
        if (!text) return;

        const newPost = {
            author: 'Momin Hessen',
            content: text,
            time: 'Just now',
            likes: 0,
            created: Date.now()
        };

        if (window.MayaDB) {
            try {
                await MayaDB.add('posts', newPost);
                postInput.value = '';
                loadPosts();
                return;
            } catch (e) {
                console.log('MayaDB add error, using local', e);
            }
        }

        // Fallback local add
        localPosts.unshift({
            id: 'local-' + Date.now(),
            ...newPost
        });
        postInput.value = '';
        renderPosts(localPosts);
    }

    submitPostBtn.addEventListener('click', handleCreatePost);
    postInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCreatePost();
        }
    });

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Initial load
    loadPosts();
});
