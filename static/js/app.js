// BigQuery Release Notes Explorer JS Logic

document.addEventListener('DOMContentLoaded', () => {
    // App State
    let rawReleases = [];
    let parsedUpdates = [];
    let selectedUpdate = null;
    let currentFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const lastUpdatedSpan = document.getElementById('last-updated');
    const feedContainer = document.getElementById('feed-container');
    const searchInput = document.getElementById('search-input');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    // Composer DOM Elements
    const composerCard = document.getElementById('composer-card');
    const composerEmpty = document.getElementById('composer-empty');
    const composerActive = document.getElementById('composer-active');
    const refDate = document.getElementById('ref-date');
    const refBadge = document.getElementById('ref-badge');
    const refSnippet = document.getElementById('ref-snippet');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const btnShorten = document.getElementById('btn-shorten');
    const btnAddHashtags = document.getElementById('btn-add-hashtags');
    const btnCopy = document.getElementById('btn-copy');
    const btnTweet = document.getElementById('btn-tweet');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Fetch Release Notes
    async function fetchReleases(isManual = false) {
        try {
            setLoadingState(true);
            if (isManual) {
                refreshBtn.classList.add('refreshing');
                refreshBtn.disabled = true;
            }
            
            // Add cache buster query param
            const response = await fetch(`/api/releases?_=${new Date().getTime()}`);
            const result = await response.json();
            
            if (result.success) {
                rawReleases = result.data;
                processReleases(rawReleases);
                renderFeed();
                updateLastUpdatedTimestamp();
            } else {
                renderError(result.error || 'Failed to fetch release notes.');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            renderError('Connection error. Please check if the Flask server is running.');
        } finally {
            setLoadingState(false);
            if (isManual) {
                refreshBtn.classList.remove('refreshing');
                refreshBtn.disabled = false;
            }
        }
    }

    // Set loading UI state
    function setLoadingState(isLoading) {
        if (isLoading) {
            feedContainer.innerHTML = `
                <div class="feed-loading">
                    <i class="fa-solid fa-circle-notch fa-spin loading-spinner"></i>
                    <p>Fetching BigQuery release notes...</p>
                </div>
            `;
        }
    }

    // Update the timestamp in the header
    function updateLastUpdatedTimestamp() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        lastUpdatedSpan.textContent = `Last updated: ${timeStr}`;
    }

    // Show error state in the feed
    function renderError(message) {
        feedContainer.innerHTML = `
            <div class="feed-error">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Failed to Load Feed</h3>
                <p>${message}</p>
                <button id="retry-btn" class="btn btn-secondary" style="margin-top: 0.5rem;">
                    <i class="fa-solid fa-arrows-rotate"></i> Retry
                </button>
            </div>
        `;
        document.getElementById('retry-btn')?.addEventListener('click', () => fetchReleases(true));
    }

    // Process feed XML content into structured updates
    function processReleases(releases) {
        parsedUpdates = [];
        const parser = new DOMParser();

        releases.forEach((release, rIdx) => {
            const dateStr = release.title;
            const linkUrl = release.link || 'https://docs.cloud.google.com/bigquery/docs/release-notes';
            const htmlContent = release.content;
            
            if (!htmlContent) return;

            // Parse HTML content
            const doc = parser.parseFromString(htmlContent, 'text/html');
            const children = Array.from(doc.body.children);
            
            let currentUpdate = null;
            let updateCounter = 0;

            children.forEach((child) => {
                const isHeading = child.tagName === 'H3' || child.tagName === 'H4';
                
                if (isHeading) {
                    // Save the previous update if exists
                    if (currentUpdate) {
                        parsedUpdates.push(currentUpdate);
                    }
                    
                    const typeText = child.textContent.trim();
                    updateCounter++;
                    
                    currentUpdate = {
                        id: `update-${rIdx}-${updateCounter}`,
                        date: dateStr,
                        type: typeText,
                        normalizedType: typeText.toLowerCase(),
                        html: '',
                        text: '',
                        link: linkUrl
                    };
                } else {
                    if (!currentUpdate) {
                        // In case text precedes any H3 header
                        updateCounter++;
                        currentUpdate = {
                            id: `update-${rIdx}-${updateCounter}`,
                            date: dateStr,
                            type: 'General',
                            normalizedType: 'general',
                            html: '',
                            text: '',
                            link: linkUrl
                        };
                    }
                    
                    currentUpdate.html += child.outerHTML;
                    currentUpdate.text += child.textContent + ' ';
                }
            });

            // Save the last update for this release
            if (currentUpdate) {
                parsedUpdates.push(currentUpdate);
            }
        });

        // Clean up parsed text spacing
        parsedUpdates.forEach(update => {
            update.text = update.text.replace(/\s+/g, ' ').trim();
        });
    }

    // Group and Render parsed updates based on current search & filter
    function renderFeed() {
        // Filter updates
        const filtered = parsedUpdates.filter(update => {
            const matchesFilter = currentFilter === 'all' || update.normalizedType.includes(currentFilter);
            const matchesSearch = searchQuery === '' || 
                update.date.toLowerCase().includes(searchQuery) ||
                update.type.toLowerCase().includes(searchQuery) ||
                update.text.toLowerCase().includes(searchQuery);
            
            return matchesFilter && matchesSearch;
        });

        if (filtered.length === 0) {
            feedContainer.innerHTML = `
                <div class="feed-empty">
                    <i class="fa-solid fa-magnifying-glass" style="font-size: 2.5rem; color: var(--text-muted);"></i>
                    <h3>No results found</h3>
                    <p>Try adjusting your search terms or filter settings.</p>
                </div>
            `;
            return;
        }

        // Group by Date
        const grouped = {};
        filtered.forEach(update => {
            if (!grouped[update.date]) {
                grouped[update.date] = [];
            }
            grouped[update.date].push(update);
        });

        // Render HTML
        let html = '';
        for (const date in grouped) {
            html += `
                <div class="release-date-group">
                    <h2 class="group-date-header">${date}</h2>
            `;
            
            grouped[date].forEach(update => {
                const isSelected = selectedUpdate && selectedUpdate.id === update.id;
                const cardClass = isSelected ? 'selected' : '';
                const typeClass = `type-${update.normalizedType}`;
                
                // Get display badge class
                let badgeClass = 'tag-badge general';
                if (update.normalizedType.includes('feature')) badgeClass = 'tag-badge feature';
                else if (update.normalizedType.includes('fix')) badgeClass = 'tag-badge fix';
                else if (update.normalizedType.includes('change')) badgeClass = 'tag-badge changed';
                else if (update.normalizedType.includes('deprecat')) badgeClass = 'tag-badge deprecated';

                html += `
                    <div class="release-item-card ${cardClass} ${typeClass}" data-id="${update.id}">
                        <div class="release-card-header">
                            <div class="card-meta">
                                <span class="${badgeClass}">${update.type}</span>
                            </div>
                            <div class="card-header-actions">
                                <button class="btn-card-copy" data-id="${update.id}" title="Copy description to clipboard" aria-label="Copy description">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                                <div class="card-select-indicator">
                                    <i class="fa-solid ${isSelected ? 'fa-circle-check' : 'fa-circle'}"></i>
                                    <span>${isSelected ? 'Selected' : 'Select'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="release-card-body">
                            ${update.html}
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }

        feedContainer.innerHTML = html;

        // Attach click handlers to cards
        document.querySelectorAll('.release-item-card').forEach(card => {
            card.addEventListener('click', () => {
                const updateId = card.getAttribute('data-id');
                const updateObj = parsedUpdates.find(u => u.id === updateId);
                if (updateObj) {
                    selectUpdateItem(updateObj);
                }
            });
        });

        // Attach click handlers to card copy buttons
        document.querySelectorAll('.btn-card-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card selection click event
                const updateId = btn.getAttribute('data-id');
                const updateObj = parsedUpdates.find(u => u.id === updateId);
                if (updateObj) {
                    navigator.clipboard.writeText(updateObj.text).then(() => {
                        showToast('Description copied to clipboard!');
                    }).catch(err => {
                        console.error('Copy failed:', err);
                        // Fallback copy
                        const el = document.createElement('textarea');
                        el.value = updateObj.text;
                        document.body.appendChild(el);
                        el.select();
                        document.execCommand('copy');
                        document.body.removeChild(el);
                        showToast('Description copied to clipboard!');
                    });
                }
            });
        });
    }

    // Select Update and populate Twitter Composer
    function selectUpdateItem(update) {
        selectedUpdate = update;
        
        // Re-render feed to show highlight changes
        renderFeed();

        // Update composer UI state
        composerCard.classList.remove('empty');
        composerEmpty.classList.add('hidden');
        composerActive.classList.remove('hidden');

        // Reference details
        refDate.textContent = update.date;
        refBadge.textContent = update.type;
        
        // Clean class list of refBadge and add correct one
        refBadge.className = 'badge';
        if (update.normalizedType.includes('feature')) refBadge.classList.add('badge-feature');
        else if (update.normalizedType.includes('fix')) refBadge.classList.add('badge-fix');
        else if (update.normalizedType.includes('change')) refBadge.classList.add('badge-changed');
        else if (update.normalizedType.includes('deprecat')) refBadge.classList.add('badge-deprecated');

        refSnippet.textContent = update.text;

        // Generate default tweet text
        generateDefaultTweet();
    }

    // Generate Tweet content
    function generateDefaultTweet() {
        if (!selectedUpdate) return;
        
        const dateStr = selectedUpdate.date;
        const typeStr = selectedUpdate.type;
        const text = selectedUpdate.text;
        const link = selectedUpdate.link;

        // Base tweet layout
        // We count URLs as 23 characters for Twitter limit, but show real characters here.
        const header = `BigQuery Update (${dateStr} - ${typeStr}):\n`;
        const hashtags = `\n#BigQuery #GoogleCloud`;
        
        // Let's compose standard text
        const maxTextLen = 280 - header.length - hashtags.length - (link ? link.length + 2 : 0);
        let trimmedText = text;
        if (trimmedText.length > maxTextLen) {
            trimmedText = trimmedText.substring(0, maxTextLen - 3) + '...';
        }

        const defaultTweet = `${header}${trimmedText}\n${link}${hashtags}`;
        tweetTextarea.value = defaultTweet;
        updateCharCount();
    }

    // Character Counter logic
    function updateCharCount() {
        const text = tweetTextarea.value;
        
        // In real Twitter API, links are always wrapped with t.co links which take 23 characters.
        // Let's calculate standard character length, but also give Twitter t.co adjusted count.
        // For simple user experience, we will show actual text length inside textarea.
        const length = text.length;
        charCounter.textContent = `${length} / 280`;

        // Style warnings
        charCounter.className = 'character-counter';
        if (length > 280) {
            charCounter.classList.add('danger');
            btnTweet.disabled = true;
            btnTweet.style.opacity = '0.5';
        } else {
            if (length > 250) {
                charCounter.classList.add('warning');
            }
            btnTweet.disabled = false;
            btnTweet.style.opacity = '1';
        }
    }

    // Shorten Text Button click handler
    btnShorten.addEventListener('click', () => {
        if (!selectedUpdate) return;

        const dateStr = selectedUpdate.date;
        const typeStr = selectedUpdate.type;
        const text = selectedUpdate.text;
        const link = selectedUpdate.link;

        const header = `BQ Update (${dateStr} - ${typeStr}):\n`;
        const hashtags = `\n#BigQuery`; // smaller hashtag list
        
        // Calculate limit
        const maxTextLen = 280 - header.length - hashtags.length - (link ? link.length + 2 : 0);
        let trimmedText = text;
        
        // Try summarizing or aggressively truncating
        if (trimmedText.length > maxTextLen) {
            trimmedText = trimmedText.substring(0, maxTextLen - 3) + '...';
        }

        tweetTextarea.value = `${header}${trimmedText}\n${link}${hashtags}`;
        updateCharCount();
        showToast('Tweet shortened to fit character limit!');
    });

    // Add Emojis / Hashtags Button click handler
    btnAddHashtags.addEventListener('click', () => {
        let currentText = tweetTextarea.value;
        const extraTags = ' #GCP #DataAnalytics';
        
        if (!currentText.includes('#GCP')) {
            tweetTextarea.value = currentText + extraTags;
            updateCharCount();
            showToast('Additional hashtags added!');
        } else {
            showToast('Hashtags already present.');
        }
    });

    // Copy Tweet Text
    btnCopy.addEventListener('click', () => {
        tweetTextarea.select();
        document.execCommand('copy');
        // Deselect text
        window.getSelection().removeAllRanges();
        showToast('Tweet copied to clipboard!');
    });

    // Share Tweet on X
    btnTweet.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    });

    // Toast notifications
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2500);
    }

    // Textarea manual edits
    tweetTextarea.addEventListener('input', updateCharCount);

    // Search input handler
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderFeed();
    });

    // Filter tabs handlers
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentFilter = tab.getAttribute('data-type');
            renderFeed();
        });
    });

    // Export currently filtered updates to CSV
    function exportToCSV() {
        // Filter updates exactly like renderFeed does
        const filtered = parsedUpdates.filter(update => {
            const matchesFilter = currentFilter === 'all' || update.normalizedType.includes(currentFilter);
            const matchesSearch = searchQuery === '' || 
                update.date.toLowerCase().includes(searchQuery) ||
                update.type.toLowerCase().includes(searchQuery) ||
                update.text.toLowerCase().includes(searchQuery);
            
            return matchesFilter && matchesSearch;
        });

        if (filtered.length === 0) {
            showToast('No data to export.');
            return;
        }

        // CSV Headers
        let csvContent = "\ufeffDate,Type,Description,Link\n"; // Added BOM for Excel UTF-8 support

        filtered.forEach(update => {
            // Escape double quotes inside values by doubling them
            const escapeCSV = (str) => `"${str.replace(/"/g, '""')}"`;
            
            const dateVal = escapeCSV(update.date);
            const typeVal = escapeCSV(update.type);
            const textVal = escapeCSV(update.text);
            const linkVal = escapeCSV(update.link);
            
            csvContent += `${dateVal},${typeVal},${textVal},${linkVal}\n`;
        });

        // Trigger file download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = new Date().toISOString().slice(0, 10);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `bigquery_release_notes_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Exported filtered data to CSV!');
    }

    // Export CSV button listener
    exportCsvBtn.addEventListener('click', exportToCSV);

    // Refresh button listener
    refreshBtn.addEventListener('click', () => {
        fetchReleases(true);
    });

    // Initial Fetch
    fetchReleases();
});
