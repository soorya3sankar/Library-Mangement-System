/* ============================================================
   Bookhaven — Library Management System
   Single script shared by every page. Data lives in localStorage
   under three keys: bh_books, bh_members, bh_transactions.
   Each page only calls the render function that matches
   document.body.dataset.page, so this file is safe to include
   everywhere unchanged.
   ============================================================ */

const DB_KEYS = { books: 'bh_books', members: 'bh_members', tx: 'bh_transactions' };
const LOAN_DAYS = 14;

/* ---------- storage helpers ---------- */

function loadDB(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveDB(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Could not save data', e);
  }
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ---------- seed data (first run only) ---------- */

function seedIfEmpty() {
  if (!loadDB(DB_KEYS.books)) {
    saveDB(DB_KEYS.books, [
      { id: 1, title: 'The Silent Patient', author: 'Alex Michaelides', isbn: '9781250301697', genre: 'Thriller', copies: 4, available: 2 },
      { id: 2, title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', isbn: '9780062316097', genre: 'Non-fiction', copies: 3, available: 3 },
      { id: 3, title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', genre: 'Technology', copies: 5, available: 4 },
      { id: 4, title: 'The Alchemist', author: 'Paulo Coelho', isbn: '9780061122415', genre: 'Fiction', copies: 6, available: 6 },
      { id: 5, title: 'Introduction to Algorithms', author: 'Cormen, Leiserson, Rivest, Stein', isbn: '9780262033848', genre: 'Technology', copies: 2, available: 1 },
      { id: 6, title: 'Ikigai', author: 'Héctor García & Francesc Miralles', isbn: '9780143130727', genre: 'Self-help', copies: 3, available: 2 },
    ]);
  }
  if (!loadDB(DB_KEYS.members)) {
    saveDB(DB_KEYS.members, [
      { id: 1, name: 'Ananya Rao', email: 'ananya.rao@example.com', phone: '98765 43210', joined: '2025-01-14' },
      { id: 2, name: 'Karthik Subramaniam', email: 'karthik.s@example.com', phone: '90123 45678', joined: '2025-03-02' },
      { id: 3, name: 'Priya Menon', email: 'priya.menon@example.com', phone: '99887 66554', joined: '2025-06-20' },
    ]);
  }
  if (!loadDB(DB_KEYS.tx)) {
    const t = todayISO();
    saveDB(DB_KEYS.tx, [
      { id: 1, bookId: 1, memberId: 1, issueDate: addDays(t, -10), dueDate: addDays(t, 4), returnDate: null, status: 'active' },
      { id: 2, bookId: 5, memberId: 2, issueDate: addDays(t, -20), dueDate: addDays(t, -6), returnDate: null, status: 'active' },
      { id: 3, bookId: 3, memberId: 3, issueDate: addDays(t, -30), dueDate: addDays(t, -16), returnDate: addDays(t, -18), status: 'returned' },
    ]);
  }
}

/* ---------- toast ---------- */

let toastTimer = null;
function showToast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- nav toggle (mobile) ---------- */

function wireNavToggle() {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
}

/* ---------- derived helpers ---------- */

function getBooks() { return loadDB(DB_KEYS.books) || []; }
function getMembers() { return loadDB(DB_KEYS.members) || []; }
function getTx() { return loadDB(DB_KEYS.tx) || []; }

function activeLoans() {
  return getTx().filter(t => t.status === 'active');
}

function isOverdue(t) {
  return t.status === 'active' && t.dueDate < todayISO();
}

function bookById(id) { return getBooks().find(b => b.id === id); }
function memberById(id) { return getMembers().find(m => m.id === id); }

/* ==========================================================
   DASHBOARD (index.html)
   ========================================================== */

function renderDashboard() {
  const books = getBooks();
  const members = getMembers();
  const loans = activeLoans();
  const overdue = loans.filter(isOverdue);
  const totalCopies = books.reduce((s, b) => s + b.copies, 0);

  setText('stat-titles', books.length);
  setText('stat-copies-sub', `${totalCopies} copies on the shelf`);
  setText('stat-members', members.length);
  setText('stat-loans', loans.length);
  setText('stat-overdue', overdue.length);

  const feed = document.getElementById('activity-feed');
  if (feed) {
    const items = [...getTx()]
      .sort((a, b) => (b.returnDate || b.issueDate).localeCompare(a.returnDate || a.issueDate))
      .slice(0, 6);
    if (items.length === 0) {
      feed.innerHTML = '<li>No activity yet. Issue a book to get started.</li>';
    } else {
      feed.innerHTML = items.map(t => {
        const book = bookById(t.bookId);
        const member = memberById(t.memberId);
        const title = book ? book.title : 'Unknown title';
        const who = member ? member.name : 'Unknown member';
        const action = t.status === 'returned'
          ? `${who} returned <strong>${escapeHTML(title)}</strong>`
          : isOverdue(t)
            ? `${who} still holds <strong>${escapeHTML(title)}</strong> — overdue`
            : `${who} borrowed <strong>${escapeHTML(title)}</strong>`;
        const when = t.status === 'returned' ? t.returnDate : t.issueDate;
        return `<li><span class="activity-dot"></span><div><div>${action}</div><div class="activity-time">${formatDate(when)}</div></div></li>`;
      }).join('');
    }
  }
}

/* ==========================================================
   BOOKS (books.html)
   ========================================================== */

function renderBooks() {
  const form = document.getElementById('book-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const books = getBooks();
      const title = document.getElementById('f-title').value.trim();
      const author = document.getElementById('f-author').value.trim();
      const isbn = document.getElementById('f-isbn').value.trim();
      const genre = document.getElementById('f-genre').value.trim() || 'General';
      const copies = Math.max(1, parseInt(document.getElementById('f-copies').value, 10) || 1);
      if (!title || !author) return;
      books.push({ id: nextId(books), title, author, isbn, genre, copies, available: copies });
      saveDB(DB_KEYS.books, books);
      form.reset();
      showToast(`Added "${title}" to the catalogue`);
      paintBookTable();
    });
  }
  paintBookTable();

  const search = document.getElementById('book-search');
  const genreFilter = document.getElementById('book-genre-filter');
  if (search) search.addEventListener('input', paintBookTable);
  if (genreFilter) genreFilter.addEventListener('change', paintBookTable);
}

function paintBookTable() {
  const tbody = document.getElementById('books-tbody');
  if (!tbody) return;
  const books = getBooks();

  const genreFilter = document.getElementById('book-genre-filter');
  if (genreFilter && genreFilter.options.length <= 1) {
    const genres = [...new Set(books.map(b => b.genre))].sort();
    genreFilter.innerHTML = '<option value="">All genres</option>' +
      genres.map(g => `<option value="${escapeHTML(g)}">${escapeHTML(g)}</option>`).join('');
  }

  const q = (document.getElementById('book-search')?.value || '').trim().toLowerCase();
  const genre = document.getElementById('book-genre-filter')?.value || '';

  const filtered = books.filter(b => {
    const matchesQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q);
    const matchesGenre = !genre || b.genre === genre;
    return matchesQ && matchesGenre;
  });

  const count = document.getElementById('books-count');
  if (count) count.textContent = `${filtered.length} of ${books.length} titles`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty"><div class="empty-mark">📖</div><p>No books match your search.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => `
    <tr>
      <td><span class="cell-title">${escapeHTML(b.title)}</span><span class="cell-sub">${escapeHTML(b.isbn || 'No ISBN on file')}</span></td>
      <td>${escapeHTML(b.author)}</td>
      <td>${escapeHTML(b.genre)}</td>
      <td>${b.copies}</td>
      <td>${b.available > 0 ? `<span class="badge badge-available">${b.available} free</span>` : `<span class="badge badge-out">All on loan</span>`}</td>
      <td><div class="row-actions">
        <button class="btn btn-outline btn-sm" onclick="editBook(${b.id})">Edit</button>
        <button class="btn btn-danger" onclick="deleteBook(${b.id})">Remove</button>
      </div></td>
    </tr>
  `).join('');
}

function editBook(id) {
  const books = getBooks();
  const book = books.find(b => b.id === id);
  if (!book) return;
  const copies = prompt(`Total copies of "${book.title}"`, book.copies);
  if (copies === null) return;
  const n = Math.max(1, parseInt(copies, 10) || book.copies);
  const onLoan = book.copies - book.available;
  book.copies = n;
  book.available = Math.max(0, n - onLoan);
  saveDB(DB_KEYS.books, books);
  showToast('Book details updated');
  paintBookTable();
}

function deleteBook(id) {
  const books = getBooks();
  const book = books.find(b => b.id === id);
  if (!book) return;
  if (!confirm(`Remove "${book.title}" from the catalogue?`)) return;
  saveDB(DB_KEYS.books, books.filter(b => b.id !== id));
  showToast('Book removed');
  paintBookTable();
}

/* ==========================================================
   MEMBERS (members.html)
   ========================================================== */

function renderMembers() {
  const form = document.getElementById('member-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const members = getMembers();
      const name = document.getElementById('m-name').value.trim();
      const email = document.getElementById('m-email').value.trim();
      const phone = document.getElementById('m-phone').value.trim();
      if (!name) return;
      members.push({ id: nextId(members), name, email, phone, joined: todayISO() });
      saveDB(DB_KEYS.members, members);
      form.reset();
      showToast(`${name} enrolled as a member`);
      paintMemberTable();
    });
  }
  paintMemberTable();

  const search = document.getElementById('member-search');
  if (search) search.addEventListener('input', paintMemberTable);
}

function paintMemberTable() {
  const tbody = document.getElementById('members-tbody');
  if (!tbody) return;
  const members = getMembers();
  const q = (document.getElementById('member-search')?.value || '').trim().toLowerCase();

  const filtered = members.filter(m =>
    !q || m.name.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)
  );

  const count = document.getElementById('members-count');
  if (count) count.textContent = `${filtered.length} of ${members.length} members`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty"><div class="empty-mark">🪪</div><p>No members match your search.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(m => {
    const borrowed = activeLoans().filter(t => t.memberId === m.id).length;
    return `
      <tr>
        <td><span class="cell-title">${escapeHTML(m.name)}</span><span class="cell-sub">Member #${String(m.id).padStart(4, '0')}</span></td>
        <td>${escapeHTML(m.email || '—')}</td>
        <td>${escapeHTML(m.phone || '—')}</td>
        <td>${formatDate(m.joined)}<span class="cell-sub">${borrowed} on loan now</span></td>
        <td><div class="row-actions">
          <button class="btn btn-danger" onclick="deleteMember(${m.id})">Remove</button>
        </div></td>
      </tr>
    `;
  }).join('');
}

function deleteMember(id) {
  const members = getMembers();
  const member = members.find(m => m.id === id);
  if (!member) return;
  const hasLoan = activeLoans().some(t => t.memberId === id);
  if (hasLoan) {
    alert(`${member.name} still has a book on loan. Return it before removing this member.`);
    return;
  }
  if (!confirm(`Remove ${member.name} from the members list?`)) return;
  saveDB(DB_KEYS.members, members.filter(m => m.id !== id));
  showToast('Member removed');
  paintMemberTable();
}

/* ==========================================================
   ISSUE & RETURN (issue-return.html)
   ========================================================== */

function renderIssueReturn() {
  populateIssueSelects();

  const form = document.getElementById('issue-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const bookId = parseInt(document.getElementById('i-book').value, 10);
      const memberId = parseInt(document.getElementById('i-member').value, 10);
      if (!bookId || !memberId) return;

      const books = getBooks();
      const book = books.find(b => b.id === bookId);
      if (!book || book.available < 1) {
        showToast('No copies available for that title');
        return;
      }
      book.available -= 1;
      saveDB(DB_KEYS.books, books);

      const tx = getTx();
      const issueDate = todayISO();
      tx.push({
        id: nextId(tx), bookId, memberId,
        issueDate, dueDate: addDays(issueDate, LOAN_DAYS),
        returnDate: null, status: 'active',
      });
      saveDB(DB_KEYS.tx, tx);

      form.reset();
      showToast('Book issued');
      populateIssueSelects();
      paintLoansTable();
      paintHistoryTable();
    });
  }

  paintLoansTable();
  paintHistoryTable();
}

function populateIssueSelects() {
  const bookSel = document.getElementById('i-book');
  const memberSel = document.getElementById('i-member');
  if (bookSel) {
    const available = getBooks().filter(b => b.available > 0);
    bookSel.innerHTML = '<option value="">Select a title…</option>' +
      (available.length
        ? available.map(b => `<option value="${b.id}">${escapeHTML(b.title)} — ${b.available} free</option>`).join('')
        : '');
    if (available.length === 0) {
      bookSel.innerHTML = '<option value="">No copies available right now</option>';
    }
  }
  if (memberSel) {
    const members = getMembers();
    memberSel.innerHTML = '<option value="">Select a member…</option>' +
      members.map(m => `<option value="${m.id}">${escapeHTML(m.name)}</option>`).join('');
  }
}

function paintLoansTable() {
  const tbody = document.getElementById('loans-tbody');
  if (!tbody) return;
  const loans = activeLoans().sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const count = document.getElementById('loans-count');
  if (count) count.textContent = `${loans.length} on loan`;

  if (loans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty"><div class="empty-mark">📚</div><p>Nothing on loan at the moment.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = loans.map(t => {
    const book = bookById(t.bookId);
    const member = memberById(t.memberId);
    const overdue = isOverdue(t);
    return `
      <tr>
        <td><span class="cell-title">${escapeHTML(book ? book.title : 'Unknown title')}</span></td>
        <td>${escapeHTML(member ? member.name : 'Unknown member')}</td>
        <td>${formatDate(t.issueDate)}</td>
        <td>${formatDate(t.dueDate)}</td>
        <td>${overdue ? '<span class="badge badge-overdue">Overdue</span>' : '<span class="badge badge-active">On time</span>'}
          <div class="row-actions" style="margin-top:8px;">
            <button class="btn btn-brass btn-sm" onclick="returnBook(${t.id})">Mark returned</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function paintHistoryTable() {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;
  const history = getTx()
    .filter(t => t.status === 'returned')
    .sort((a, b) => b.returnDate.localeCompare(a.returnDate))
    .slice(0, 12);

  if (history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty"><p>Returned books will appear here.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = history.map(t => {
    const book = bookById(t.bookId);
    const member = memberById(t.memberId);
    return `
      <tr>
        <td>${escapeHTML(book ? book.title : 'Unknown title')}</td>
        <td>${escapeHTML(member ? member.name : 'Unknown member')}</td>
        <td>${formatDate(t.issueDate)}</td>
        <td>${formatDate(t.returnDate)}</td>
      </tr>
    `;
  }).join('');
}

function returnBook(txId) {
  const tx = getTx();
  const record = tx.find(t => t.id === txId);
  if (!record) return;
  record.status = 'returned';
  record.returnDate = todayISO();
  saveDB(DB_KEYS.tx, tx);

  const books = getBooks();
  const book = books.find(b => b.id === record.bookId);
  if (book) book.available = Math.min(book.copies, book.available + 1);
  saveDB(DB_KEYS.books, books);

  showToast('Book marked as returned');
  populateIssueSelects();
  paintLoansTable();
  paintHistoryTable();
}

/* ---------- misc ---------- */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- boot ---------- */

document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();
  wireNavToggle();

  const page = document.body.dataset.page;
  if (page === 'dashboard') renderDashboard();
  if (page === 'books') renderBooks();
  if (page === 'members') renderMembers();
  if (page === 'issue-return') renderIssueReturn();
});
