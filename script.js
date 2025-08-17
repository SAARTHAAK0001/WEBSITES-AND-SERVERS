// Star rating
const stars = document.querySelectorAll('.stars span');
const ratingValue = document.getElementById('rating-value');

stars.forEach(star => {
  star.addEventListener('click', () => {
    let value = star.getAttribute('data-value');
    ratingValue.textContent = `Your rating: ${value}`;
    stars.forEach(s => s.classList.remove('active'));
    for (let i = 0; i < value; i++) {
      stars[i].classList.add('active');
    }
  });
});

// Like/Dislike
const likeBtn = document.getElementById('like');
const dislikeBtn = document.getElementById('dislike');
const feedbackResult = document.getElementById('feedback-result');

likeBtn.addEventListener('click', () => feedbackResult.textContent = "You liked this product!");
dislikeBtn.addEventListener('click', () => feedbackResult.textContent = "You disliked this product!");

// Submit Review
const reviewInput = document.getElementById('review-text');
const submitReview = document.getElementById('submit-review');
const reviewsList = document.getElementById('reviews-list');

submitReview.addEventListener('click', () => {
  const text = reviewInput.value.trim();
  if(text !== "") {
    const li = document.createElement('li');
    li.textContent = text;
    reviewsList.appendChild(li);
    reviewInput.value = "";
  } else {
    alert("Please write a review first!");
  }
});
