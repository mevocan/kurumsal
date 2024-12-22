document.getElementById('nav-toggle').addEventListener('change', function () {
    const dashboard = document.getElementById('admin-dashboard');
    if (this.checked) {
      dashboard.classList.add('nav-collapsed');
    } else {
      dashboard.classList.remove('nav-collapsed');
    }
  });
  