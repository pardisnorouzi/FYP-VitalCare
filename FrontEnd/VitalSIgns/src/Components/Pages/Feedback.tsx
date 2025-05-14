import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { addFeedback } from './../feedbackReducer';
import { BiUser } from 'react-icons/bi';

const Feedback = () => {
  const dispatch = useDispatch();
  const storedFeedbacks = localStorage.getItem('feedbacks');
  const initialFeedbacks = storedFeedbacks ? JSON.parse(storedFeedbacks) : [];
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (name && comment && rating) {
      const newFeedback = { name, comment, rating: parseInt(rating) };
      setFeedbacks([...feedbacks, newFeedback]);
      dispatch(addFeedback(newFeedback));
      setName('');
      setComment('');
      setRating(null);
      setShowAlert(false);
    } else {
      setShowAlert(true);
    }
  };

  const handleRatingChange = (value: number) => {
    setRating(value.toString());
  };

  return (
    <div className='table-container'>
    <Row>
      <Col md={{ span: 8, offset: 2 }}>
        <div>
          <h2>Feedback</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formComment">
              <Form.Label>Comment</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter your comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Form.Group>
            Rating: <br />
            <fieldset className="rating">
              <input type="radio" id="star5" name="rating" value="5" checked={rating === '5'} onChange={() => handleRatingChange(5)} />
              <label htmlFor="star5">5 stars</label>

              <input type="radio" id="star4" name="rating" value="4" checked={rating === '4'} onChange={() => handleRatingChange(4)} />
              <label htmlFor="star4">4 stars</label>

              <input type="radio" id="star3" name="rating" value="3" checked={rating === '3'} onChange={() => handleRatingChange(3)} />
              <label htmlFor="star3">3 stars</label>

              <input type="radio" id="star2" name="rating" value="2" checked={rating === '2'} onChange={() => handleRatingChange(2)} />
              <label htmlFor="star2">2 stars</label>

              <input type="radio" id="star1" name="rating" value="1" checked={rating === '1'} onChange={() => handleRatingChange(1)} />
              <label htmlFor="star1">1 star</label>
            </fieldset>
            <br /><br />
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Form>
          {showAlert && (
            <Alert variant="danger" className="mt-3">
              All fields are required!
            </Alert>
          )}
          <hr />
          <Row xs={1} sm={2} md={3} className="g-4">
            {feedbacks.map((feedback: any, index: number) => (
              <Col key={index} xs={12} sm={6} md={4}>
                <Card className="bg-light mb-3">
                  <Card.Header>
                  <BiUser /> {feedback.name}
                  </Card.Header>
                  <Card.Body>
                    <Card.Text>{feedback.comment}</Card.Text>
                    <Card.Text>Rating: {feedback.rating}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Col>
    </Row>
    </div>
  );
};

export default Feedback;
