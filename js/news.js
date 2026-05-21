// news.js — fetches and renders news posts
// Requires: marked.js (loaded before this script)

(function () {
  var DRIVE = 'https://drive.google.com/drive/folders/1y6J7BgRbqjNSq1TGpLfYI2tDJngiW1Zl?usp=share_link';

  function slugify(title) {
    return encodeURIComponent(
      title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/, '')
    );
  }

  function formatDate(str) {
    return new Date(str + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  function renderCard(post) {
    var slug = slugify(post.title);
    return '<div class="news-card" onclick="News.show(\'' + slug + '\')">'
      + '<span class="news-tag">' + post.category + '</span>'
      + '<h3>' + post.title + '</h3>'
      + '<p>' + post.excerpt + '</p>'
      + '<div class="news-date">' + formatDate(post.date) + '</div>'
      + '</div>';
  }

  function renderVideos(videos) {
    if (!videos || !videos.length) return '';
    return '<div style="display:flex;flex-direction:column;gap:1.5rem;margin-bottom:2rem;">'
      + videos.map(function (v) {
        return '<div class="video-embed">'
          + '<p class="video-label">' + v.label + '</p>'
          + '<div class="video-wrap">'
          + '<iframe src="' + v.url + '" allowfullscreen loading="lazy" title="' + v.label + '"></iframe>'
          + '</div></div>';
      }).join('')
      + '</div>';
  }

  // ── Homepage preview (3 cards, no filters) ──────────────
  function initHomepage(posts) {
    var el = document.getElementById('recentNews');
    if (!el) return;
    var recent = posts.slice(0, 3);
    el.innerHTML = recent.map(renderCard).join('');
  }

  // ── Full news page ───────────────────────────────────────
  var allPosts   = [];
  var activeFilter = '';

  function renderList() {
    var grid = document.getElementById('newsGrid');
    if (!grid) return;
    var filtered = activeFilter
      ? allPosts.filter(function (p) { return p.category === activeFilter; })
      : allPosts;
    if (!filtered.length) {
      grid.innerHTML = '<p style="padding:2rem;color:var(--text-muted);">No posts found.</p>';
      return;
    }
    grid.innerHTML = filtered.map(renderCard).join('');
  }

  function showPost(slug) {
    var post = allPosts.find(function (p) { return slugify(p.title) === slug; });
    if (!post) return;

    document.getElementById('listView').style.display = 'none';
    document.getElementById('postView').style.display = 'block';

    document.getElementById('postHeader').innerHTML =
      '<h1>' + post.title + '</h1>'
      + '<div class="news-post-meta">'
      + '<span class="news-tag">' + post.category + '</span>'
      + '<span>' + formatDate(post.date) + '</span>'
      + (post.author ? '<span>' + post.author + '</span>' : '')
      + '</div>';

    document.getElementById('postBody').innerHTML =
      renderVideos(post.videos) + marked.parse(post.body || '');

    history.pushState(null, '', 'news.html#' + slug);
    window.scrollTo(0, 0);
  }

  function showList() {
    document.getElementById('listView').style.display = 'block';
    document.getElementById('postView').style.display = 'none';
    history.pushState(null, '', 'news.html');
    window.scrollTo(0, 0);
  }

  function initNewsPage(posts) {
    allPosts = posts;

    // Back button
    var back = document.getElementById('backBtn');
    if (back) back.addEventListener('click', showList);

    // Filter buttons
    var filters = document.getElementById('filters');
    if (filters) {
      filters.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter-btn');
        if (!btn) return;
        document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeFilter = btn.dataset.cat;
        renderList();
      });
    }

    renderList();

    // Check for direct hash link
    var hash = window.location.hash.slice(1);
    if (hash) showPost(hash);

    window.addEventListener('popstate', function () {
      var h = window.location.hash.slice(1);
      if (h) showPost(h); else showList();
    });
  }

  // ── Boot ────────────────────────────────────────────────
  // Build path relative to current page, works in any subdirectory
  var base = window.location.pathname.replace(/\/[^\/]*$/, '/');
  fetch(base + 'data/news.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      var posts = (data.posts || []).sort(function (a, b) {
        return new Date(b.date) - new Date(a.date);
      });

      if (document.getElementById('recentNews')) initHomepage(posts);
      if (document.getElementById('newsGrid'))   initNewsPage(posts);
    })
    .catch(function (err) {
      console.error('News load error:', err);
      ['recentNews', 'newsGrid'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = '<p style="padding:2rem;color:var(--text-muted);">Could not load news.</p>';
      });
    });

  // Expose showPost for inline onclick
  window.News = { show: showPost };
})();
