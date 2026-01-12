// Initialize Supabase client
var supabase;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('App initializing...');
  
  // Check if config is loaded
  if (typeof CONFIG === 'undefined') {
    showMessage('authMessage', 'Error: Configuration not loaded. Please check config.js file.', 'error');
    return;
  }

  // Validate config
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
    showMessage('authMessage', 'Error: Supabase URL and Key are required. Please update config.js with your credentials.', 'error');
    return;
  }

  if (CONFIG.SUPABASE_URL === 'YOUR_SUPABASE_URL' || CONFIG.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    showMessage('authMessage', 'Please update config.js with your actual Supabase credentials.', 'error');
    return;
  }

  // Initialize Supabase
  try {
    supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    console.log('Supabase client initialized');
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    showMessage('authMessage', 'Failed to initialize Supabase: ' + error.message, 'error');
    return;
  }

  // Set up event listeners
  setupEventListeners();

  // Check initial auth state
  checkAuthState();
});

// Set up all event listeners
function setupEventListeners() {
  // Tab switching
  document.getElementById('loginTab').addEventListener('click', () => {
    console.log('Login tab clicked');
    showTab('login');
  });
  document.getElementById('signupTab').addEventListener('click', () => {
    console.log('Signup tab clicked');
    showTab('signup');
  });

  // Form submissions
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('signupForm').addEventListener('submit', handleSignup);
  document.getElementById('createNoteForm').addEventListener('submit', handleCreateNote);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  console.log('Event listeners set up');
}

// Check authentication state
async function checkAuthState() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error checking auth state:', error);
      return;
    }

    if (session) {
      console.log('User is logged in:', session.user.email);
      showNotesSection(session.user);
    } else {
      console.log('No active session');
      showAuthSection();
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (session) {
        showNotesSection(session.user);
      } else {
        showAuthSection();
      }
    });
  } catch (error) {
    console.error('Error in checkAuthState:', error);
    showMessage('authMessage', 'Error checking authentication: ' + error.message, 'error');
  }
}

// Show login or signup tab
function showTab(tab) {
  console.log('showTab called with:', tab);
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    loginTab.classList.remove('active');
    signupTab.classList.add('active');
  }

  // Clear messages when switching tabs
  document.getElementById('authMessage').innerHTML = '';
}

// Handle signup
async function handleSignup(e) {
  e.preventDefault();
  console.log('Signup form submitted');

  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

  // Validate passwords match
  if (password !== passwordConfirm) {
    showMessage('authMessage', 'Passwords do not match!', 'error');
    return;
  }

  // Validate password length
  if (password.length < 6) {
    showMessage('authMessage', 'Password must be at least 6 characters long.', 'error');
    return;
  }

  // Disable submit button
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing up...';

  try {
    console.log('Attempting signup for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('Signup error:', error);
      showMessage('authMessage', error.message, 'error');
    } else {
      console.log('Signup successful:', data);
      showMessage('authMessage', 'Account created successfully! You can now login.', 'success');
      
      // Clear form
      document.getElementById('signupForm').reset();
      
      // Switch to login tab after 2 seconds
      setTimeout(() => {
        showTab('login');
        document.getElementById('loginEmail').value = email;
      }, 2000);
    }
  } catch (error) {
    console.error('Unexpected error during signup:', error);
    showMessage('authMessage', 'An unexpected error occurred: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign Up';
  }
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  console.log('Login form submitted');

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  // Disable submit button
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    console.log('Attempting login for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('Login error:', error);
      showMessage('authMessage', error.message, 'error');
    } else {
      console.log('Login successful');
      // Auth state change listener will handle the transition
    }
  } catch (error) {
    console.error('Unexpected error during login:', error);
    showMessage('authMessage', 'An unexpected error occurred: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
}

// Handle logout
async function handleLogout() {
  console.log('Logging out...');
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      showMessage('notesMessage', 'Error logging out: ' + error.message, 'error');
    } else {
      console.log('Logout successful');
      showAuthSection();
    }
  } catch (error) {
    console.error('Unexpected error during logout:', error);
    showMessage('notesMessage', 'An unexpected error occurred: ' + error.message, 'error');
  }
}

// Handle create note
async function handleCreateNote(e) {
  e.preventDefault();
  console.log('Create note form submitted');

  const title = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();

  if (!title) {
    showMessage('notesMessage', 'Please enter a title for your note.', 'error');
    return;
  }

  // Disable submit button
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User error:', userError);
      showMessage('notesMessage', 'You must be logged in to create notes.', 'error');
      return;
    }

    console.log('Creating note for user:', user.id);

    const { data, error } = await supabase
      .from('notes')
      .insert([{
        title: title,
        content: content,
        user_id: user.id
      }])
      .select();

    if (error) {
      console.error('Create note error:', error);
      showMessage('notesMessage', error.message, 'error');
    } else {
      console.log('Note created successfully:', data);
      showMessage('notesMessage', 'Note created successfully!', 'success');
      document.getElementById('createNoteForm').reset();
      loadNotes();
    }
  } catch (error) {
    console.error('Unexpected error creating note:', error);
    showMessage('notesMessage', 'An unexpected error occurred: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Note';
  }
}

// Delete note
async function deleteNote(id) {
  if (!confirm('Are you sure you want to delete this note?')) {
    return;
  }

  console.log('Deleting note:', id);

  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete note error:', error);
      showMessage('notesMessage', error.message, 'error');
    } else {
      console.log('Note deleted successfully');
      showMessage('notesMessage', 'Note deleted successfully!', 'success');
      loadNotes();
    }
  } catch (error) {
    console.error('Unexpected error deleting note:', error);
    showMessage('notesMessage', 'An unexpected error occurred: ' + error.message, 'error');
  }
}

// Load notes
async function loadNotes() {
  console.log('Loading notes...');
  const notesList = document.getElementById('notesList');
  notesList.innerHTML = '<div class="loading">Loading notes...</div>';

  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load notes error:', error);
      notesList.innerHTML = `<div class="error">${error.message}</div>`;
      return;
    }

    console.log('Notes loaded:', data.length);

    if (data.length === 0) {
      notesList.innerHTML = `
        <div class="empty-state">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
          </svg>
          <p>No notes yet. Create your first note above!</p>
        </div>
      `;
      return;
    }

    notesList.innerHTML = data.map(note => `
      <div class="note-card" data-original-title="${escapeHtml(note.title)}" data-original-content="${escapeHtml(note.content || '')}">
        <h3>${escapeHtml(note.title)}</h3>
        <p>${escapeHtml(note.content || 'No content')}</p>
        <small>Created: ${new Date(note.created_at).toLocaleString()}</small>
        <br><br>
        <button class="btn-secondary" onclick="editNote('${note.id}')">Edit</button>
        <button class="btn-danger" onclick="deleteNote('${note.id}')">Delete</button>
      </div>
    `).join('');
  } catch (error) {
    console.error('Unexpected error loading notes:', error);
    notesList.innerHTML = `<div class="error">An unexpected error occurred: ${error.message}</div>`;
  }
}

// Show auth section
function showAuthSection() {
  document.getElementById('authSection').classList.add('active');
  document.getElementById('notesSection').classList.remove('active');
  document.getElementById('authMessage').innerHTML = '';
}

// Show notes section
function showNotesSection(user) {
  document.getElementById('authSection').classList.remove('active');
  document.getElementById('notesSection').classList.add('active');
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('notesMessage').innerHTML = '';
  loadNotes();
}

// Show message
function showMessage(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.innerHTML = `<div class="${type}">${escapeHtml(message)}</div>`;
  
  // Auto-clear success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      el.innerHTML = '';
    }, 5000);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Edit note
function editNote(id) {
  const noteCard = document.querySelector(`button[onclick="editNote('${id}')"]`).parentElement;
  const h3 = noteCard.querySelector('h3');
  const p = noteCard.querySelector('p');
  const originalTitle = noteCard.dataset.originalTitle;
  const originalContent = noteCard.dataset.originalContent;

  // Replace with inputs
  h3.innerHTML = `<input type="text" value="${originalTitle}" id="editTitle${id}">`;
  p.innerHTML = `<textarea id="editContent${id}">${originalContent}</textarea>`;

  // Replace buttons
  const editBtn = noteCard.querySelector('button[onclick*="editNote"]');
  const deleteBtn = noteCard.querySelector('button[onclick*="deleteNote"]');
  editBtn.outerHTML = `<button class="btn-secondary" onclick="saveNote('${id}')">Save</button>`;
  deleteBtn.outerHTML = `<button class="btn-danger" onclick="cancelEdit('${id}')">Cancel</button>`;
}

// Save note
async function saveNote(id) {
  const title = document.getElementById(`editTitle${id}`).value.trim();
  const content = document.getElementById(`editContent${id}`).value.trim();

  if (!title) {
    showMessage('notesMessage', 'Please enter a title for your note.', 'error');
    return;
  }

  try {
    const { data, error } = await supabase
      .from('notes')
      .update({ title: title, content: content })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Update note error:', error);
      showMessage('notesMessage', error.message, 'error');
    } else {
      console.log('Note updated successfully:', data);
      showMessage('notesMessage', 'Note updated successfully!', 'success');
      loadNotes();
    }
  } catch (error) {
    console.error('Unexpected error updating note:', error);
    showMessage('notesMessage', 'An unexpected error occurred: ' + error.message, 'error');
  }
}

// Cancel edit
function cancelEdit(id) {
  loadNotes(); // Reload to reset
}

// Make functions available globally
window.deleteNote = deleteNote;
window.editNote = editNote;
window.saveNote = saveNote;
window.cancelEdit = cancelEdit;