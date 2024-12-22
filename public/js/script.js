document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/message')
      .then(response => response.json())
      .then(data => {
        console.log(data.message);    })
      .catch(error => console.error('Error:', error));
});
  