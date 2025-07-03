import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar.css'; // Custom stylish CSS
import axios from 'axios'; // Assuming you're using axios for API calls

const CalendarComponent = () => {
  const [date, setDate] = useState(new Date()); // Selected date
  const [month, setMonth] = useState(new Date().getMonth() + 1); // Current month
  const [events, setEvents] = useState([]);
  const [eventsData, setEventsData] = useState({});
  const authToken = localStorage.getItem('token'); // Assuming you have authToken stored

  // Fetch events for the selected month and user
  const fetchEvents = async (month, userId) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_URL}/dashboard/calenderevent?month=${month}&userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      
      const fetchedEvents = response.data.data;
      console.log('Fetched Events:', fetchedEvents); // Log the fetched events
      
      if (fetchedEvents && typeof fetchedEvents === 'object') {
        setEventsData(fetchedEvents);
      } else {
        setEventsData({}); // Handle case where data is not structured as expected
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEventsData({});
    }
  };

  // Function to check for events on a selected date
  const onDateChange = (selectedDate) => {
    const selectedDateStr = selectedDate.toLocaleDateString('en-CA'); // Local date string in YYYY-MM-DD format
    setDate(selectedDate);

    console.log('Selected Date:', selectedDateStr); // Log the selected date

    const foundEvents = eventsData[selectedDateStr] || []; // Fetch events for the selected date
    setEvents(foundEvents);
    
    console.log('Events for Selected Date:', foundEvents); // Log the events for the selected date
  };

  // Function to handle month navigation in the calendar
  const onActiveStartDateChange = ({ activeStartDate }) => {
    const newMonth = activeStartDate.getMonth() + 1; // Get the new month
    if (newMonth !== month) {
      setMonth(newMonth); // Update month state if it changes
    }
  };

  // Fetch events whenever the month changes
  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve the logged-in user ID
    fetchEvents(month, userId);
  }, [month]); // Only trigger when the month changes

  return (
    <div className="calendar-container calendar-container-angel">
      <Calendar
        onChange={onDateChange}
        value={date}
        className="custom-calendar custom-calendar-angel"
        tileContent={({ date, view }) => {
          const dateStr = date.toLocaleDateString('en-CA'); // Local date string in YYYY-MM-DD format
          const hasEvent = eventsData[dateStr] && eventsData[dateStr].length > 0;
          return hasEvent && view === 'month' ? <div className="event-marker" /> : null;
        }}
        onActiveStartDateChange={onActiveStartDateChange} // Detect month change
      />
      <div className="events-list">
        <h3>Events on {date.toDateString()}:</h3>
        {events.length > 0 ? (
          <ul>
            {events.map((event, index) => (
              <li key={index}>
                <strong>{event.generalFollowUpName}</strong>: {event.description} ({event.status})
              </li>
            ))}
          </ul>
        ) : (
          <p>No events for this day.</p>
        )}
      </div>
    </div>
  );
};

export default CalendarComponent;
