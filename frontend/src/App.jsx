import { useEffect, useState } from "react";

import { getEvents, getEvent } from "./api/events";
import { getShowSeats } from "./api/seats";
import { lockSeat, unlockSeat } from "./api/seatLocks";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
} from "./api/bookings";
import { createPayment } from "./api/payments";
import { getTicketQR } from "./api/tickets";
import { login } from "./api/auth";
import { API_URL } from "./config";

function App() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [pricingTiers, setPricingTiers] = useState([]);

  // Customer - Location filter
  const [selectedLocation, setSelectedLocation] = useState("");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);

  const [booking, setBooking] = useState(null);
  const [seatsLocked, setSeatsLocked] = useState(false);
  const [lockedSeatIds, setLockedSeatIds] = useState([]);
  const [payment, setPayment] = useState(null);
  const [ticketQR, setTicketQR] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registering, setRegistering] = useState(false);

  // Registration OTP
  const [registrationOtpSent, setRegistrationOtpSent] = useState(false);
  const [registrationOtp, setRegistrationOtp] = useState("");
  const [registrationOtpSending, setRegistrationOtpSending] = useState(false);
  const [registrationOtpVerifying, setRegistrationOtpVerifying] = useState(false);

  // Forgot password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotResetting, setForgotResetting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());

  // My Bookings
  const [myBookings, setMyBookings] = useState([]);
  const [showBookings, setShowBookings] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Viewed ticket
  const [viewedTicket, setViewedTicket] = useState(null);
  const [viewedTicketQR, setViewedTicketQR] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(false);

  // Admin
  const [showAdminDashboard, setShowAdminDashboard] =
    useState(false);

  // Admin - Create Event
  const [showCreateEventForm, setShowCreateEventForm] =
    useState(false);
  const [eventName, setEventName] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventCreating, setEventCreating] = useState(false);

  // Admin - Venue
  const [showCreateVenueForm, setShowCreateVenueForm] = useState(false);
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueCreating, setVenueCreating] = useState(false);

  // Admin - Show
  const [showCreateShowForm, setShowCreateShowForm] = useState(false);
  const [showEventId, setShowEventId] = useState("");
  const [showVenueId, setShowVenueId] = useState("");
  const [showPricingTierId, setShowPricingTierId] = useState("");
  const [showDate, setShowDate] = useState("");
  const [showTime, setShowTime] = useState("");
  const [showCreating, setShowCreating] = useState(false);
  const [showManageShows, setShowManageShows] = useState(false);
  const [adminShows, setAdminShows] = useState([]);
  const [adminShowsLoading, setAdminShowsLoading] = useState(false);
  const [showDeletingId, setShowDeletingId] = useState(null);

  // Admin - Pricing
  const [showCreatePricingForm, setShowCreatePricingForm] = useState(false);
  const [pricingTierName, setPricingTierName] = useState("");
  const [pricingPrice, setPricingPrice] = useState("");
  const [pricingCreating, setPricingCreating] = useState(false);

  // Admin - Seats
  const [showGenerateSeatsForm, setShowGenerateSeatsForm] = useState(false);
  const [seatVenueId, setSeatVenueId] = useState("");
  const [seatRows, setSeatRows] = useState("");
  const [seatSeatsPerRow, setSeatSeatsPerRow] = useState("");
  const [seatsGenerating, setSeatsGenerating] = useState(false);

  // Admin - Bookings
  const [showAdminBookings, setShowAdminBookings] = useState(false);
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminBookingsLoading, setAdminBookingsLoading] = useState(false);

  // Admin - Dashboard Statistics
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardStatsLoading, setDashboardStatsLoading] = useState(false);
  const [dashboardStatsError, setDashboardStatsError] = useState("");

  // Load events and venues
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [eventsData, venuesResponse, pricingResponse] = await Promise.all([
          getEvents(),
          fetch(`${API_URL}/venues/`),
          fetch(`${API_URL}/pricing/`),
        ]);

        if (!venuesResponse.ok) {
          const data = await venuesResponse.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to load venues");
        }

        const venuesData = await venuesResponse.json();
        const pricingData = await pricingResponse.json();

        if (!pricingResponse.ok) {
          throw new Error(pricingData.detail || "Failed to load pricing tiers");
        }

        setEvents(eventsData.events || []);
        setVenues(venuesData.venues || []);
        setPricingTiers(pricingData.pricing_tiers || []);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load initial data:", err);
        setError(err.message || "Failed to load events and venues");
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Re-check show times periodically so completed shows disappear
  // from the customer view without requiring a page refresh.
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  function isShowCompleted(show) {
    if (!show?.show_date || !show?.show_time) {
      return false;
    }

    const showDateTime = new Date(
      `${show.show_date}T${show.show_time}`
    );

    if (Number.isNaN(showDateTime.getTime())) {
      return false;
    }

    return showDateTime.getTime() <= currentTime;
  }

  // Cities are provided by the backend from venues that have shows.
  const availableLocations = Array.from(
    new Set(
      events.flatMap((event) => event.locations || [])
    )
  ).sort((a, b) => a.localeCompare(b));

  // Only show events that have at least one show in the selected city.
  const locationFilteredEvents = selectedLocation
    ? events.filter((event) =>
        (event.locations || []).some(
          (location) =>
            location.toLowerCase() === selectedLocation.toLowerCase()
        )
      )
    : [];

  async function refreshVenues() {
    try {
      const response = await fetch(`${API_URL}/venues/`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load venues");
      }

      setVenues(data.venues || []);
    } catch (err) {
      console.error("Failed to refresh venues:", err);
    }
  }

  async function refreshPricingTiers() {
    try {
      const response = await fetch(`${API_URL}/pricing/`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load pricing tiers");
      }

      setPricingTiers(data.pricing_tiers || []);
    } catch (err) {
      console.error("Failed to refresh pricing tiers:", err);
    }
  }

  // Get logged-in user's information and role
  useEffect(() => {
    if (!token) {
      setUser(null);
      setUserRole(null);
      return;
    }

    async function loadCurrentUser() {
      try {
        const response = await fetch(
          `${API_URL}/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Failed to load user"
          );
        }

        setUser(data);
        setUserRole(data.role);

        // Automatically show admin dashboard
        // for admin users.
        if (data.role === "admin") {
          setShowAdminDashboard(true);
        } else {
          setShowAdminDashboard(false);
        }
      } catch (err) {
        console.error(
          "Failed to load current user:",
          err
        );

        localStorage.removeItem("access_token");
        setToken(null);
        setUser(null);
        setUserRole(null);
        setLoginError(err.message || "Session expired. Please log in again.");
      }
    }

    loadCurrentUser();
  }, [token]);

  // Load admin dashboard statistics when an admin dashboard is active.
  useEffect(() => {
    if (token && userRole === "admin" && showAdminDashboard) {
      loadDashboardStats();
    }
  }, [token, userRole, showAdminDashboard]);

  // Refresh seats every 3 minutes
  useEffect(() => {
    if (!token || !selectedShow) {
      return;
    }

    const refreshSeats = async () => {
      try {
        const data = await getShowSeats(
          selectedShow.show_id
        );

        setSeats((currentSeats) =>
          data.seats.map((seat) => {
            const existingSeat = currentSeats.find(
              (item) =>
                item.show_seat_id ===
                seat.show_seat_id
            );

            return {
              ...seat,
              selected:
                existingSeat?.selected || false,
            };
          })
        );
      } catch (err) {
        console.error(
          "Failed to refresh seats:",
          err
        );
      }
    };

    refreshSeats();

    const interval = setInterval(
      refreshSeats,
      180000
    );

    return () => clearInterval(interval);
  }, [token, selectedShow]);

  async function handleLogin(event) {
    event.preventDefault();

    try {
      setLoginError("");
      setError("");

      const data = await login(
        email,
        password
      );

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      setToken(data.access_token);

      setEmail("");
      setPassword("");
    } catch (err) {
      setLoginError(err.message);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    try {
      setRegisterError("");
      setRegisterSuccess("");
      setRegistrationOtpSending(true);

      const response = await fetch(`${API_URL}/auth/register/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: registerName.trim(),
          email: registerEmail.trim().toLowerCase(),
          password: registerPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;
        throw new Error(detail || "Failed to send registration OTP");
      }

      setRegistrationOtpSent(true);
      setRegisterSuccess("OTP sent to your email. Check your inbox and enter the 6-digit OTP.");
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegistrationOtpSending(false);
    }
  }

  async function handleVerifyRegistrationOtp(event) {
    event.preventDefault();

    try {
      setRegisterError("");
      setRegisterSuccess("");
      setRegistrationOtpVerifying(true);

      const response = await fetch(`${API_URL}/auth/register/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail.trim().toLowerCase(),
          otp: registrationOtp.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;
        throw new Error(detail || "Failed to verify OTP");
      }

      setRegisterSuccess("Email verified and account created successfully. You can log in now.");
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegistrationOtp("");
      setRegistrationOtpSent(false);
      setShowRegister(false);
    } catch (err) {
      setRegisterError(err.message);
    } finally {
      setRegistrationOtpVerifying(false);
    }
  }

  async function handleForgotPasswordRequest(event) {
    event.preventDefault();

    try {
      setForgotError("");
      setForgotSuccess("");
      setForgotSending(true);

      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;
        throw new Error(detail || "Failed to send password reset OTP");
      }

      setForgotOtpSent(true);
      setForgotSuccess("If the email is registered, a password reset OTP has been sent. Check your inbox.");
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotSending(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();

    try {
      setForgotError("");
      setForgotSuccess("");
      setForgotResetting(true);

      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          otp: forgotOtp.trim(),
          new_password: forgotNewPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;
        throw new Error(detail || "Failed to reset password");
      }

      setForgotSuccess("Password reset successfully. You can now log in with your new password.");
      setForgotEmail("");
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotOtpSent(false);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotResetting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");

    if (ticketQR) {
      URL.revokeObjectURL(ticketQR);
    }

    if (viewedTicketQR) {
      URL.revokeObjectURL(viewedTicketQR);
    }

    setToken(null);
    setUser(null);
    setUserRole(null);

    setSelectedEvent(null);
    setSelectedShow(null);
    setSeats([]);

    setBooking(null);
    setPayment(null);
    setTicketQR(null);

    setSeatsLocked(false);
    setLockedSeatIds([]);

    setMyBookings([]);
    setShowBookings(false);

    setViewedTicket(null);
    setViewedTicketQR(null);

    setShowAdminDashboard(false);
    setShowManageShows(false);
    setShowDeletingId(null);
    setAdminShows([]);
    setShowCreateEventForm(false);
    setShowManageShows(false);
    setShowDeletingId(null);
    setEventName("");
    setEventCategory("");
    setEventDescription("");

    setVenueName("");
    setVenueAddress("");
    setVenueCity("");
    setShowEventId("");
    setShowVenueId("");
    setShowDate("");
    setShowTime("");
    setShowPricingTierId("");
    setPricingTierName("");
    setPricingPrice("");
    setSeatVenueId("");
    setSeatRows("");
    setSeatSeatsPerRow("");
    setAdminBookings([]);
    setDashboardStats(null);
    setDashboardStatsError("");
    closeAdminForms();

    setError("");
    setSuccessMessage("");
  }

  async function handleViewEvent(eventId) {
    try {
      setError("");
      setShowBookings(false);
      setShowAdminDashboard(false);

      const data = await getEvent(eventId);

      setSelectedEvent(data);
    } catch {
      setError(
        "Failed to load event details"
      );
    }
  }

  async function handleSelectShow(show) {
    try {
      setError("");

      if (isShowCompleted(show)) {
        throw new Error(
          "This show has already completed and is no longer available for booking."
        );
      }

      const data = await getShowSeats(
        show.show_id
      );

      setSeats(data.seats);
      setSelectedShow(show);

      setSeatsLocked(false);
      setLockedSeatIds([]);
    } catch {
      setError("Failed to load seats");
    }
  }

  function toggleSeat(seat) {
    if (seat.status !== "AVAILABLE") {
      return;
    }

    setSeats((currentSeats) =>
      currentSeats.map((item) =>
        item.show_seat_id ===
        seat.show_seat_id
          ? {
              ...item,
              selected: !item.selected,
            }
          : item
      )
    );
  }

  async function handleLockSeats() {
    if (!token) {
      setError(
        "Please login before booking"
      );
      return;
    }

    const selectedSeats = seats.filter(
      (seat) => seat.selected
    );

    if (selectedSeats.length === 0) {
      setError(
        "Please select at least one seat"
      );
      return;
    }

    try {
      setError("");
      setProcessing(true);

      const successfullyLocked = [];

      try {
        for (const seat of selectedSeats) {
          await lockSeat(
            seat.show_seat_id,
            token
          );
          successfullyLocked.push(seat.show_seat_id);
        }
      } catch (lockErr) {
        // Roll back any seats we managed to lock before the
        // failure, so they don't sit locked for no reason.
        await Promise.all(
          successfullyLocked.map((id) =>
            unlockSeat(id, token).catch(() => {})
          )
        );
        throw lockErr;
      }

      setLockedSeatIds(
        selectedSeats.map(
          (seat) => seat.show_seat_id
        )
      );

      const updatedSeats =
        await getShowSeats(
          selectedShow.show_id
        );

      const selectedIds =
        selectedSeats.map(
          (seat) => seat.show_seat_id
        );

      const refreshedSeats =
        updatedSeats.seats.map(
          (seat) => ({
            ...seat,
            selected:
              selectedIds.includes(
                seat.show_seat_id
              ),
          })
        );

      setSeats(refreshedSeats);
      setSeatsLocked(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handlePayment() {
    if (!token || !seatsLocked) {
      return;
    }

    try {
      setError("");
      setProcessing(true);

      const selectedSeatIds =
        lockedSeatIds;

      const bookingData =
        await createBooking(
          selectedShow.show_id,
          selectedSeatIds,
          token
        );

      const bookingId =
        bookingData.booking_id;

      const paymentData =
        await createPayment(
          bookingId,
          token
        );

      const qrBlob =
        await getTicketQR(
          bookingId,
          token
        );

      const qrUrl =
        URL.createObjectURL(qrBlob);

      setBooking(bookingData);
      setPayment(paymentData);
      setTicketQR(qrUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleViewBookings() {
    try {
      setError("");
      setBookingsLoading(true);

      setShowBookings(true);
      setShowAdminDashboard(false);

      setSelectedEvent(null);
      setSelectedShow(null);
      setSeats([]);

      setBooking(null);
      setPayment(null);

      if (ticketQR) {
        URL.revokeObjectURL(ticketQR);
      }

      if (viewedTicketQR) {
        URL.revokeObjectURL(
          viewedTicketQR
        );
      }

      setTicketQR(null);

      setSeatsLocked(false);
      setLockedSeatIds([]);

      setViewedTicket(null);
      setViewedTicketQR(null);

      const data =
        await getMyBookings(token);

      setMyBookings(
        data.bookings || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBookingsLoading(false);
    }
  }

  async function handleRefreshBookings() {
    try {
      setError("");
      setBookingsLoading(true);

      const data =
        await getMyBookings(token);

      setMyBookings(
        data.bookings || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBookingsLoading(false);
    }
  }

  async function handleCancelBooking(bookingId) {
    try {
      setError("");
      setBookingsLoading(true);

      await cancelBooking(bookingId, token);

      const data = await getMyBookings(token);

      setMyBookings(data.bookings || []);
      setSuccessMessage("Booking cancelled and seats released.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBookingsLoading(false);
    }
  }

  async function handleViewTicket(
    bookingItem
  ) {
    try {
      setError("");
      setTicketLoading(true);

      if (viewedTicketQR) {
        URL.revokeObjectURL(
          viewedTicketQR
        );
      }

      const qrBlob =
        await getTicketQR(
          bookingItem.booking_id,
          token
        );

      const qrUrl =
        URL.createObjectURL(qrBlob);

      setViewedTicket(bookingItem);
      setViewedTicketQR(qrUrl);

      setShowBookings(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setTicketLoading(false);
    }
  }

  function handleBackToBookings() {
    if (viewedTicketQR) {
      URL.revokeObjectURL(
        viewedTicketQR
      );
    }

    setViewedTicket(null);
    setViewedTicketQR(null);
    setError("");

    setShowBookings(true);
  }

  function handleBackToEvents() {
    if (ticketQR) {
      URL.revokeObjectURL(ticketQR);
    }

    if (viewedTicketQR) {
      URL.revokeObjectURL(
        viewedTicketQR
      );
    }

    setBooking(null);
    setPayment(null);
    setTicketQR(null);

    setViewedTicket(null);
    setViewedTicketQR(null);

    setSelectedShow(null);
    setSelectedEvent(null);
    setSeats([]);

    setError("");

    setSeatsLocked(false);
    setLockedSeatIds([]);

    setShowBookings(false);
    setSelectedLocation("");

    if (userRole === "admin") {
      setShowAdminDashboard(true);
    }
  }

  function handleBackToShow() {
    setSelectedShow(null);
    setSeats([]);

    setError("");

    setSeatsLocked(false);
    setLockedSeatIds([]);
  }

  async function handleCreateEvent(event) {
    event.preventDefault();

    if (!token || userRole !== "admin") {
      setError("Only admins can create events");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setEventCreating(true);

      const response = await fetch(`${API_URL}/events/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: eventName,
          category: eventCategory,
          description: eventDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to create event"
        );
      }

      // Refresh the event list so the newly created event
      // is immediately available to customers.
      const eventsData = await getEvents();
      setEvents(eventsData.events || []);

      setEventName("");
      setEventCategory("");
      setEventDescription("");
      setShowCreateEventForm(false);

      setError("");
      setSuccessMessage("Event created successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setEventCreating(false);
    }
  }

  async function adminPost(path, body, fallbackMessage) {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const detail = Array.isArray(data.detail)
        ? data.detail.map((item) => item.msg).join(", ")
        : data.detail;
      throw new Error(detail || fallbackMessage);
    }

    return data;
  }

  function closeAdminForms() {
    setShowCreateEventForm(false);
    setShowCreateVenueForm(false);
    setShowCreateShowForm(false);
    setShowCreatePricingForm(false);
    setShowGenerateSeatsForm(false);
    setShowAdminBookings(false);
    setShowManageShows(false);
  }

  async function refreshAdminShows() {
    if (!token || userRole !== "admin") {
      return;
    }

    try {
      setAdminShowsLoading(true);

      const response = await fetch(`${API_URL}/shows/`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;
        throw new Error(detail || "Failed to load shows");
      }

      setAdminShows(data.shows || []);
    } catch (err) {
      setError(err.message);
      setAdminShows([]);
    } finally {
      setAdminShowsLoading(false);
    }
  }

  async function handleCreateVenue(event) {
    event.preventDefault();

    if (!token || userRole !== "admin") {
      setError("Only admins can create venues");
      return;
    }

    try {
      setError("");
      setVenueCreating(true);

      await adminPost(
        "/venues/",
        {
          name: venueName,
          address: venueAddress,
          city: venueCity,
        },
        "Failed to create venue"
      );

      setVenueName("");
      setVenueAddress("");
      setVenueCity("");
      setShowCreateVenueForm(false);
      await refreshVenues();
      setSuccessMessage("Venue created successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setVenueCreating(false);
    }
  }

  async function handleCreateShow(event) {
    event.preventDefault();

    if (!token || userRole !== "admin") {
      setError("Only admins can create shows");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setShowCreating(true);

      await adminPost(
        "/shows/",
        {
          event_id: Number(showEventId),
          venue_id: Number(showVenueId),
          pricing_tier_id: Number(showPricingTierId),
          show_date: showDate,
          show_time: showTime,
        },
        "Failed to create show"
      );

      setShowEventId("");
      setShowVenueId("");
      setShowPricingTierId("");
      setShowDate("");
      setShowTime("");
      setShowCreateShowForm(false);
      setSuccessMessage("Show created successfully.");

      const eventsData = await getEvents();
      setEvents(eventsData.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setShowCreating(false);
    }
  }

  async function handleDeleteShow(showId) {
    if (!token || userRole !== "admin") {
      setError("Only admins can delete shows");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this show? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setShowDeletingId(showId);

      const response = await fetch(
        `${API_URL}/shows/${showId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;

        throw new Error(
          detail || "Failed to delete show"
        );
      }

      const eventsData = await getEvents();
      setEvents(eventsData.events || []);
      await refreshAdminShows();

      setShowManageShows(true);
      setSuccessMessage("Show deleted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setShowDeletingId(null);
    }
  }

  async function handleCreatePricing(event) {
    event.preventDefault();

    if (!token || userRole !== "admin") {
      setError("Only admins can create pricing");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setPricingCreating(true);

      await adminPost(
        "/pricing/",
        {
          name: pricingTierName,
          price: Number(pricingPrice),
        },
        "Failed to create pricing"
      );

      setPricingTierName("");
      setPricingPrice("");
      setShowCreatePricingForm(false);
      await refreshPricingTiers();
      setSuccessMessage("Pricing tier created successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setPricingCreating(false);
    }
  }

  async function handleGenerateSeats(event) {
    event.preventDefault();

    if (!token || userRole !== "admin") {
      setError("Only admins can generate seats");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setSeatsGenerating(true);

      const rowList = seatRows
        .split(",")
        .map((row) => row.trim())
        .filter(Boolean);

      if (rowList.length === 0) {
        throw new Error("Please enter at least one row, for example A,B,C");
      }

      const seatsPerRow = Number(seatSeatsPerRow);

      if (!Number.isInteger(seatsPerRow) || seatsPerRow < 1) {
        throw new Error("Seats per row must be a positive number");
      }

      await adminPost(
        "/seats/generate",
        {
          venue_id: Number(seatVenueId),
          rows: rowList,
          seats_per_row: seatsPerRow,
        },
        "Failed to generate seats"
      );

      setSeatVenueId("");
      setSeatRows("");
      setSeatSeatsPerRow("");
      setShowGenerateSeatsForm(false);
      setSuccessMessage("Seats generated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSeatsGenerating(false);
    }
  }

  async function loadDashboardStats() {
    if (!token || userRole !== "admin") {
      return;
    }

    try {
      setDashboardStatsLoading(true);
      setDashboardStatsError("");

      const response = await fetch(`${API_URL}/admin/dashboard-stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;
        throw new Error(detail || "Failed to load dashboard statistics");
      }

      setDashboardStats(data);
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
      setDashboardStatsError(
        err.message || "Failed to load dashboard statistics"
      );
    } finally {
      setDashboardStatsLoading(false);
    }
  }

  async function handleViewAdminBookings() {
    if (!token || userRole !== "admin") {
      setError("Only admins can view bookings");
      return;
    }

    try {
      setError("");
      setAdminBookingsLoading(true);
      closeAdminForms();
      setShowAdminBookings(true);

      const response = await fetch(`${API_URL}/bookings/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(", ")
          : data.detail;
        throw new Error(detail || "Failed to load bookings");
      }

      setAdminBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdminBookingsLoading(false);
    }
  }

  async function handleRefreshAdminBookings() {
    await handleViewAdminBookings();
  }

  async function handleAdminDashboard() {
    setSelectedEvent(null);
    setSelectedShow(null);
    setSeats([]);

    setBooking(null);
    setPayment(null);

    if (ticketQR) {
      URL.revokeObjectURL(ticketQR);
    }

    if (viewedTicketQR) {
      URL.revokeObjectURL(
        viewedTicketQR
      );
    }

    setTicketQR(null);
    setViewedTicket(null);
    setViewedTicketQR(null);

    setShowBookings(false);
    setSeatsLocked(false);
    setLockedSeatIds([]);

    setShowCreateEventForm(false);
    setEventName("");
    setEventCategory("");
    setEventDescription("");

    setError("");

    setShowAdminDashboard(true);
    await loadDashboardStats();
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">

        {/* ============================= */}
        {/* HEADER */}
        {/* ============================= */}

        <div className="mb-8 flex items-center justify-between">

          <h1 className="text-4xl font-bold">
            Event Ticketing Platform
          </h1>

          {token && (
            <div className="flex items-center gap-3">

              {userRole === "admin" && (
                <button
                  onClick={
                    handleAdminDashboard
                  }
                  className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
                >
                  Admin Dashboard
                </button>
              )}

              {userRole === "customer" && (
                <button
                  onClick={
                    handleViewBookings
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  My Bookings
                </button>
              )}

              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
              >
                Logout
              </button>

            </div>
          )}

        </div>

        {/* ============================= */}
        {/* LOGIN / REGISTRATION / FORGOT PASSWORD */}
        {/* ============================= */}

        {!token && !showRegister && !showForgotPassword && (
          <div className="mb-8 max-w-md rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-2xl font-bold">Login</h2>
            <form onSubmit={handleLogin}>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3 w-full rounded-lg border p-3" required />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="mb-3 w-full rounded-lg border p-3" required />
              <button type="submit" className="w-full rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">Login</button>
            </form>
            {loginError && <p className="mt-3 text-red-600">{loginError}</p>}
            {registerSuccess && <p className="mt-3 text-green-600">{registerSuccess}</p>}
            <button type="button" onClick={() => { setShowRegister(true); setShowForgotPassword(false); setLoginError(""); setRegisterError(""); setRegisterSuccess(""); }} className="mt-4 w-full text-sm font-semibold text-blue-600 hover:underline">New here? Create an account</button>
            <button type="button" onClick={() => { setShowForgotPassword(true); setShowRegister(false); setLoginError(""); setForgotError(""); setForgotSuccess(""); }} className="mt-3 w-full text-sm font-semibold text-gray-700 hover:underline">Forgot Password?</button>
          </div>
        )}

        {!token && showRegister && (
          <div className="mb-8 max-w-md rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-2xl font-bold">Create Account</h2>
            {!registrationOtpSent ? (
              <form onSubmit={handleRegister}>
                <input type="text" placeholder="Full name" value={registerName} onChange={(e) => setRegisterName(e.target.value)} className="mb-3 w-full rounded-lg border p-3" required />
                <input type="email" placeholder="Email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} className="mb-3 w-full rounded-lg border p-3" required />
                <input type="password" placeholder="Password (minimum 6 characters)" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="mb-3 w-full rounded-lg border p-3" minLength={6} required />
                <button type="submit" disabled={registrationOtpSending} className="w-full rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400">{registrationOtpSending ? "Sending OTP..." : "Send OTP"}</button>
              </form>
            ) : (
              <form onSubmit={handleVerifyRegistrationOtp}>
                <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">We sent a 6-digit OTP to <strong>{registerEmail}</strong>. The OTP is valid for 10 minutes.</p>
                <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Enter 6-digit OTP" value={registrationOtp} onChange={(e) => setRegistrationOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mb-3 w-full rounded-lg border p-3 text-center text-xl tracking-widest" required />
                <button type="submit" disabled={registrationOtpVerifying || registrationOtp.length !== 6} className="w-full rounded-lg bg-green-600 px-5 py-3 text-white hover:bg-green-700 disabled:bg-gray-400">{registrationOtpVerifying ? "Verifying..." : "Verify OTP & Create Account"}</button>
                <button type="button" onClick={() => { setRegistrationOtpSent(false); setRegistrationOtp(""); setRegisterError(""); setRegisterSuccess(""); }} className="mt-3 w-full text-sm font-semibold text-blue-600 hover:underline">Change Details / Request New OTP</button>
              </form>
            )}
            {registerError && <p className="mt-3 text-red-600">{registerError}</p>}
            {registerSuccess && <p className="mt-3 text-green-600">{registerSuccess}</p>}
            <button type="button" onClick={() => { setShowRegister(false); setRegistrationOtpSent(false); setRegistrationOtp(""); setRegisterError(""); setRegisterSuccess(""); }} className="mt-4 w-full text-sm font-semibold text-blue-600 hover:underline">Already have an account? Log in</button>
          </div>
        )}

        {!token && showForgotPassword && (
          <div className="mb-8 max-w-md rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-2xl font-bold">Forgot Password</h2>
            {!forgotOtpSent ? (
              <form onSubmit={handleForgotPasswordRequest}>
                <p className="mb-4 text-sm text-gray-600">Enter your registered email address. We will send a password reset OTP to that email.</p>
                <input type="email" placeholder="Registered email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="mb-3 w-full rounded-lg border p-3" required />
                <button type="submit" disabled={forgotSending} className="w-full rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:bg-gray-400">{forgotSending ? "Sending OTP..." : "Send Reset OTP"}</button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <p className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Enter the OTP sent to <strong>{forgotEmail}</strong> and choose a new password.</p>
                <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit OTP" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mb-3 w-full rounded-lg border p-3 text-center text-xl tracking-widest" required />
                <input type="password" placeholder="New password (minimum 6 characters)" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} className="mb-3 w-full rounded-lg border p-3" minLength={6} required />
                <button type="submit" disabled={forgotResetting || forgotOtp.length !== 6} className="w-full rounded-lg bg-green-600 px-5 py-3 text-white hover:bg-green-700 disabled:bg-gray-400">{forgotResetting ? "Resetting Password..." : "Reset Password"}</button>
                <button type="button" onClick={() => { setForgotOtpSent(false); setForgotOtp(""); setForgotError(""); setForgotSuccess(""); }} className="mt-3 w-full text-sm font-semibold text-blue-600 hover:underline">Change Email / Request New OTP</button>
              </form>
            )}
            {forgotError && <p className="mt-3 text-red-600">{forgotError}</p>}
            {forgotSuccess && <p className="mt-3 text-green-600">{forgotSuccess}</p>}
            <button type="button" onClick={() => { setShowForgotPassword(false); setForgotOtpSent(false); setForgotEmail(""); setForgotOtp(""); setForgotNewPassword(""); setForgotError(""); setForgotSuccess(""); }} className="mt-4 w-full text-sm font-semibold text-blue-600 hover:underline">Back to Login</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p>Loading events...</p>
        )}

        {/* Error */}
        {error && (
          <p className="mb-4 text-red-600">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="mb-4 text-green-600">
            {successMessage}
          </p>
        )}

        {/* ============================= */}
        {/* ADMIN DASHBOARD */}
        {/* ============================= */}

        {token &&
          userRole === "admin" &&
          showAdminDashboard && (
            <div className="rounded-xl bg-white p-8 shadow-md">

              <div className="mb-8">
                <h2 className="text-3xl font-bold">Admin Dashboard</h2>
                <p className="mt-2 text-gray-600">
                  Welcome, {user?.name || "Admin"}. Manage your event ticketing platform from here.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 hover:shadow-md">
                  <div className="mb-4 text-4xl">📊</div>
                  <h3 className="text-xl font-bold">Dashboard Statistics</h3>
                  <p className="mt-2 text-gray-600">
                    View platform totals, revenue, customers, and recent bookings.
                  </p>
                  <button
                    onClick={loadDashboardStats}
                    disabled={dashboardStatsLoading}
                    className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {dashboardStatsLoading ? "Refreshing..." : "Refresh Statistics"}
                  </button>
                </div>

                <div className="rounded-xl border p-6 hover:shadow-md">
                  <div className="mb-4 text-4xl">📅</div>
                  <h3 className="text-xl font-bold">Event Management</h3>
                  <p className="mt-2 text-gray-600">Create and manage events.</p>
                  <button
                    onClick={() => { closeAdminForms(); setError(""); setSuccessMessage(""); setShowCreateEventForm(true); }}
                    className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >Create Event</button>
                </div>

                <div className="rounded-xl border p-6 hover:shadow-md">
                  <div className="mb-4 text-4xl">🏢</div>
                  <h3 className="text-xl font-bold">Venue Management</h3>
                  <p className="mt-2 text-gray-600">Create event venues.</p>
                  <button
                    onClick={() => { closeAdminForms(); setError(""); setSuccessMessage(""); setShowCreateVenueForm(true); }}
                    className="mt-5 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
                  >Create Venue</button>
                </div>

                <div className="rounded-xl border p-6 hover:shadow-md">
                  <div className="mb-4 text-4xl">🎭</div>
                  <h3 className="text-xl font-bold">Show Management</h3>
                  <p className="mt-2 text-gray-600">Schedule shows for events.</p>
                  <button
                    onClick={() => {
                      closeAdminForms();
                      setError("");
                      setSuccessMessage("");
                      setShowCreateShowForm(true);
                    }}
                    className="mt-5 w-full rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-700"
                  >
                    Create Show
                  </button>

                  <button
                    onClick={async () => {
                      closeAdminForms();
                      setError("");
                      setSuccessMessage("");
                      setShowManageShows(true);
                      await refreshAdminShows();
                    }}
                    className="mt-3 w-full rounded-lg bg-gray-800 px-4 py-3 font-semibold text-white hover:bg-gray-900"
                  >
                    Manage / Delete Shows
                  </button>
                </div>

                <div className="rounded-xl border p-6 hover:shadow-md">
                  <div className="mb-4 text-4xl">💰</div>
                  <h3 className="text-xl font-bold">Pricing Management</h3>
                  <p className="mt-2 text-gray-600">Create ticket pricing tiers.</p>
                  <button
                    onClick={() => { closeAdminForms(); setError(""); setSuccessMessage(""); setShowCreatePricingForm(true); }}
                    className="mt-5 w-full rounded-lg bg-yellow-600 px-4 py-3 font-semibold text-white hover:bg-yellow-700"
                  >Create Pricing</button>
                </div>

                <div className="rounded-xl border p-6 hover:shadow-md">
                  <div className="mb-4 text-4xl">💺</div>
                  <h3 className="text-xl font-bold">Seat Management</h3>
                  <p className="mt-2 text-gray-600">Generate seat layouts for a show.</p>
                  <button
                    onClick={() => { closeAdminForms(); setError(""); setSuccessMessage(""); setShowGenerateSeatsForm(true); }}
                    className="mt-5 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
                  >Generate Seats</button>
                </div>

                <div className="rounded-xl border p-6 hover:shadow-md">
                  <div className="mb-4 text-4xl">🎟️</div>
                  <h3 className="text-xl font-bold">Booking Management</h3>
                  <p className="mt-2 text-gray-600">View customer bookings.</p>
                  <button
                    onClick={handleViewAdminBookings}
                    className="mt-5 w-full rounded-lg bg-gray-800 px-4 py-3 font-semibold text-white hover:bg-gray-900"
                  >View Bookings</button>
                </div>

              </div>

              {/* Dashboard Statistics */}
              <div className="mt-8 rounded-xl border border-indigo-200 bg-indigo-50 p-6">
                <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h3 className="text-2xl font-bold">Dashboard Statistics</h3>
                    <p className="mt-1 text-gray-600">
                      Current platform activity and revenue overview.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadDashboardStats}
                    disabled={dashboardStatsLoading}
                    className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {dashboardStatsLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {dashboardStatsError && (
                  <p className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
                    {dashboardStatsError}
                  </p>
                )}

                {dashboardStatsLoading && !dashboardStats ? (
                  <p className="rounded-lg bg-white p-5 text-gray-600">
                    Loading dashboard statistics...
                  </p>
                ) : dashboardStats ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500">Total Events</p>
                        <p className="mt-2 text-3xl font-bold text-blue-600">
                          {dashboardStats.total_events}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500">Total Shows</p>
                        <p className="mt-2 text-3xl font-bold text-purple-600">
                          {dashboardStats.total_shows}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500">Total Bookings</p>
                        <p className="mt-2 text-3xl font-bold text-green-600">
                          {dashboardStats.total_bookings}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500">Total Revenue</p>
                        <p className="mt-2 text-3xl font-bold text-yellow-600">
                          ₹{Number(dashboardStats.total_revenue || 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-gray-500">Customers</p>
                        <p className="mt-2 text-3xl font-bold text-indigo-600">
                          {dashboardStats.total_customers}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
                      <h4 className="text-xl font-bold">Recent Bookings</h4>

                      {dashboardStats.recent_bookings?.length ? (
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full border-collapse text-left">
                            <thead>
                              <tr className="border-b">
                                <th className="p-3">Booking</th>
                                <th className="p-3">Customer</th>
                                <th className="p-3">Show</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Created</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboardStats.recent_bookings.map((item) => (
                                <tr key={item.booking_id} className="border-b">
                                  <td className="p-3">#{item.booking_id}</td>
                                  <td className="p-3">
                                    <div className="font-semibold">
                                      {item.customer_name || `User ${item.user_id}`}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {item.customer_email || "N/A"}
                                    </div>
                                  </td>
                                  <td className="p-3">{item.show_id}</td>
                                  <td className="p-3">
                                    ₹{Number(item.total_amount || 0).toFixed(2)}
                                  </td>
                                  <td className="p-3">{item.status}</td>
                                  <td className="p-3">
                                    {item.created_at
                                      ? new Date(item.created_at).toLocaleString()
                                      : "N/A"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="mt-4 rounded-lg bg-gray-100 p-4 text-gray-600">
                          No bookings found.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="rounded-lg bg-white p-5 text-gray-600">
                    No dashboard statistics available.
                  </p>
                )}
              </div>

              {/* Create Event */}
              {showCreateEventForm && (
                <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-2xl font-bold">Create Event</h3>
                    <button type="button" onClick={() => setShowCreateEventForm(false)} className="rounded-lg bg-gray-700 px-4 py-2 text-white">Close</button>
                  </div>
                  <form onSubmit={handleCreateEvent}>
                    <input type="text" placeholder="Event name" value={eventName} onChange={(e) => setEventName(e.target.value)} className="mb-4 w-full rounded-lg border bg-white p-3" required />
                    <input type="text" placeholder="Category" value={eventCategory} onChange={(e) => setEventCategory(e.target.value)} className="mb-4 w-full rounded-lg border bg-white p-3" required />
                    <textarea placeholder="Description" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} rows="4" className="mb-5 w-full rounded-lg border bg-white p-3" required />
                    <button type="submit" disabled={eventCreating} className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:bg-gray-400">
                      {eventCreating ? "Creating Event..." : "Create Event"}
                    </button>
                  </form>
                </div>
              )}

              {/* Create Venue */}
              {showCreateVenueForm && (
                <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-2xl font-bold">Create Venue</h3>
                    <button type="button" onClick={() => setShowCreateVenueForm(false)} className="rounded-lg bg-gray-700 px-4 py-2 text-white">Close</button>
                  </div>
                  <form onSubmit={handleCreateVenue}>
                    <input type="text" placeholder="Venue name" value={venueName} onChange={(e) => setVenueName(e.target.value)} className="mb-4 w-full rounded-lg border bg-white p-3" required />
                    <input type="text" placeholder="Address" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} className="mb-4 w-full rounded-lg border bg-white p-3" required />
                    <input type="text" placeholder="City" value={venueCity} onChange={(e) => setVenueCity(e.target.value)} className="mb-5 w-full rounded-lg border bg-white p-3" required />
                    <button type="submit" disabled={venueCreating} className="w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white disabled:bg-gray-400">
                      {venueCreating ? "Creating Venue..." : "Create Venue"}
                    </button>
                  </form>
                </div>
              )}

              {/* Create Show */}
              {showCreateShowForm && (
                <div className="mt-8 rounded-xl border border-purple-200 bg-purple-50 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-2xl font-bold">Create Show</h3>
                    <button type="button" onClick={() => setShowCreateShowForm(false)} className="rounded-lg bg-gray-700 px-4 py-2 text-white">Close</button>
                  </div>
                  <form onSubmit={handleCreateShow}>
                    <label className="mb-2 block font-semibold">Event</label>
                    <select
                      value={showEventId}
                      onChange={(e) => setShowEventId(e.target.value)}
                      className="mb-4 w-full rounded-lg border bg-white p-3"
                      required
                    >
                      <option value="">Select an event</option>
                      {events.map((event) => (
                        <option key={event.event_id} value={event.event_id}>
                          {event.name} (ID: {event.event_id})
                        </option>
                      ))}
                    </select>
                    <label className="mb-2 block font-semibold">Venue</label>
                    <select
                      value={showVenueId}
                      onChange={(e) => setShowVenueId(e.target.value)}
                      className="mb-4 w-full rounded-lg border bg-white p-3"
                      required
                    >
                      <option value="">Select a venue</option>
                      {venues.map((venue) => (
                        <option key={venue.venue_id} value={venue.venue_id}>
                          {venue.name} — {venue.city} (ID: {venue.venue_id})
                        </option>
                      ))}
                    </select>

                    <label className="mb-2 block font-semibold">Ticket Price</label>
                    <select
                      value={showPricingTierId}
                      onChange={(e) => setShowPricingTierId(e.target.value)}
                      className="mb-4 w-full rounded-lg border bg-white p-3"
                      required
                    >
                      <option value="">Select a ticket price</option>
                      {pricingTiers.map((tier) => (
                        <option key={tier.pricing_tier_id} value={tier.pricing_tier_id}>
                          {tier.name} — ₹{Number(tier.price).toFixed(2)}
                        </option>
                      ))}
                    </select>

                    <label className="mb-2 block font-semibold">Show Date</label>
                    <input type="date" value={showDate} onChange={(e) => setShowDate(e.target.value)} className="mb-4 w-full rounded-lg border bg-white p-3" required />
                    <label className="mb-2 block font-semibold">Show Time</label>
                    <input type="time" value={showTime} onChange={(e) => setShowTime(e.target.value)} className="mb-5 w-full rounded-lg border bg-white p-3" required />
                    <button type="submit" disabled={showCreating} className="w-full rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white disabled:bg-gray-400">
                      {showCreating ? "Creating Show..." : "Create Show"}
                    </button>
                  </form>
                </div>
              )}

              {/* Manage Shows */}
              {showManageShows && (
                <div className="mt-8 rounded-xl border border-gray-300 bg-gray-50 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">Manage Shows</h3>
                      <p className="mt-1 text-gray-600">
                        View scheduled shows and delete shows when required.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowManageShows(false)}
                      className="rounded-lg bg-gray-700 px-4 py-2 text-white"
                    >
                      Close
                    </button>
                  </div>

                  {adminShowsLoading ? (
                    <p className="rounded-lg bg-white p-5 text-gray-600">
                      Loading shows...
                    </p>
                  ) : adminShows.length === 0 ? (
                    <p className="rounded-lg bg-white p-5 text-gray-600">
                      No shows found.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {[...adminShows]
                        .sort((a, b) => {
                          const aTime = new Date(`${a.show_date}T${a.show_time}`).getTime();
                          const bTime = new Date(`${b.show_date}T${b.show_time}`).getTime();
                          return aTime - bTime;
                        })
                        .map((show) => {
                          const completed = isShowCompleted(show);

                          return (
                            <div key={show.show_id} className="rounded-xl border bg-white p-5">
                              <div className="flex flex-col justify-between gap-4 md:flex-row">
                                <div>
                                  <h4 className="text-xl font-bold">
                                    {show.event_name || `Event ${show.event_id}`}
                                  </h4>
                                  <p className="mt-2 text-gray-600">Show ID: {show.show_id}</p>
                                  <p className="mt-1 text-gray-600">Date: {show.show_date}</p>
                                  <p className="mt-1 text-gray-600">Time: {show.show_time}</p>
                                  <p className="mt-1 text-gray-600">Venue: {show.venue_name || "N/A"}</p>
                                  <p className="mt-1 font-semibold text-green-700">
                                    Price: ₹{Number(show.price || 0).toFixed(2)}
                                  </p>
                                  <p className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${completed ? "bg-gray-200 text-gray-700" : "bg-green-100 text-green-700"}`}>
                                    {completed ? "COMPLETED" : "UPCOMING"}
                                  </p>
                                </div>
                                <div className="flex items-start">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteShow(show.show_id)}
                                    disabled={showDeletingId === show.show_id}
                                    className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-gray-400"
                                  >
                                    {showDeletingId === show.show_id ? "Deleting..." : "Delete Show"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* Create Pricing */}
              {showCreatePricingForm && (
                <div className="mt-8 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-2xl font-bold">Create Pricing Tier</h3>
                    <button type="button" onClick={() => setShowCreatePricingForm(false)} className="rounded-lg bg-gray-700 px-4 py-2 text-white">Close</button>
                  </div>
                  <form onSubmit={handleCreatePricing}>
                    <input type="text" placeholder="Tier name (e.g. Regular)" value={pricingTierName} onChange={(e) => setPricingTierName(e.target.value)} className="mb-4 w-full rounded-lg border bg-white p-3" required />
                    <input type="number" min="0" step="0.01" placeholder="Price" value={pricingPrice} onChange={(e) => setPricingPrice(e.target.value)} className="mb-5 w-full rounded-lg border bg-white p-3" required />
                    <button type="submit" disabled={pricingCreating} className="w-full rounded-lg bg-yellow-600 px-5 py-3 font-semibold text-white disabled:bg-gray-400">
                      {pricingCreating ? "Creating Pricing..." : "Create Pricing"}
                    </button>
                  </form>
                </div>
              )}

              {/* Generate Seats */}
              {showGenerateSeatsForm && (
                <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-2xl font-bold">Generate Seats</h3>
                    <button type="button" onClick={() => setShowGenerateSeatsForm(false)} className="rounded-lg bg-gray-700 px-4 py-2 text-white">Close</button>
                  </div>
                  <form onSubmit={handleGenerateSeats}>
                    <label className="mb-2 block font-semibold">Venue</label>
                    <select
                      value={seatVenueId}
                      onChange={(e) => setSeatVenueId(e.target.value)}
                      className="mb-4 w-full rounded-lg border bg-white p-3"
                      required
                    >
                      <option value="">Select a venue</option>
                      {venues.map((venue) => (
                        <option key={venue.venue_id} value={venue.venue_id}>
                          {venue.name} — {venue.city} (ID: {venue.venue_id})
                        </option>
                      ))}
                    </select>
                    <input type="text" placeholder="Rows (example: A,B,C)" value={seatRows} onChange={(e) => setSeatRows(e.target.value)} className="mb-4 w-full rounded-lg border bg-white p-3" required />
                    <input type="number" min="1" placeholder="Seats per row" value={seatSeatsPerRow} onChange={(e) => setSeatSeatsPerRow(e.target.value)} className="mb-5 w-full rounded-lg border bg-white p-3" required />
                    <button type="submit" disabled={seatsGenerating} className="w-full rounded-lg bg-red-600 px-5 py-3 font-semibold text-white disabled:bg-gray-400">
                      {seatsGenerating ? "Generating Seats..." : "Generate Seats"}
                    </button>
                  </form>
                </div>
              )}

              {/* Admin Bookings */}
              {showAdminBookings && (
                <div className="mt-8 rounded-xl border bg-gray-50 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">All Bookings</h3>
                      <p className="mt-1 text-gray-600">Bookings recorded by the platform.</p>
                    </div>
                    <button onClick={handleRefreshAdminBookings} disabled={adminBookingsLoading} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400">
                      {adminBookingsLoading ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {adminBookingsLoading ? (
                    <p>Loading bookings...</p>
                  ) : adminBookings.length === 0 ? (
                    <p className="rounded-lg bg-white p-5 text-gray-600">No bookings found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse bg-white text-left">
                        <thead>
                          <tr className="border-b">
                            <th className="p-3">Booking ID</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Show ID</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminBookings.map((item) => (
                            <tr key={item.booking_id} className="border-b">
                              <td className="p-3">#{item.booking_id}</td>
                              <td className="p-3">{item.user_name || `User ${item.user_id}`}</td>
                              <td className="p-3">{item.user_email || "N/A"}</td>
                              <td className="p-3">{item.show_id}</td>
                              <td className="p-3">₹{Number(item.total_amount || 0).toFixed(2)}</td>
                              <td className="p-3">{item.status}</td>
                              <td className="p-3">{item.created_at ? new Date(item.created_at).toLocaleString() : "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 rounded-lg bg-gray-100 p-5">
                <h3 className="font-bold">Logged-in Account</h3>
                <p className="mt-2"><strong>Name:</strong> {user?.name}</p>
                <p className="mt-2"><strong>Email:</strong> {user?.email}</p>
                <p className="mt-2"><strong>Role:</strong> <span className="font-semibold text-purple-600">{userRole}</span></p>
              </div>

            </div>
          )}

        {/* ============================= */}
        {/* VIEWED TICKET */}
        {/* ============================= */}

        {token &&
          userRole === "customer" &&
          viewedTicket &&
          viewedTicketQR && (
            <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-md">

              <button
                onClick={
                  handleBackToBookings
                }
                className="mb-6 text-blue-600"
              >
                ← Back to My Bookings
              </button>

              <div className="mb-4 text-5xl">
                🎟️
              </div>

              <h2 className="text-3xl font-bold">
                Your Ticket
              </h2>

              <p className="mt-2 text-gray-600">
                Booking details
              </p>

              <div className="mt-6 rounded-lg bg-gray-100 p-5 text-left">

                <p>
                  <strong>
                    Booking ID:
                  </strong>{" "}
                  {
                    viewedTicket.booking_id
                  }
                </p>

                <p className="mt-2">
                  <strong>
                    Show ID:
                  </strong>{" "}
                  {
                    viewedTicket.show_id
                  }
                </p>

                <p className="mt-2">
                  <strong>
                    Amount:
                  </strong>{" "}
                  ₹
                  {
                    viewedTicket.total_amount
                  }
                </p>

                <p className="mt-2">
                  <strong>
                    Status:
                  </strong>{" "}
                  {
                    viewedTicket.status
                  }
                </p>

                <p className="mt-2">
                  <strong>
                    Booking Date:
                  </strong>{" "}
                  {viewedTicket.created_at
                    ? new Date(
                        viewedTicket.created_at
                      ).toLocaleString()
                    : "N/A"}
                </p>

              </div>

              <div className="mt-6">

                <h3 className="mb-3 text-xl font-semibold">
                  Ticket QR
                </h3>

                <img
                  src={viewedTicketQR}
                  alt="Ticket QR Code"
                  className="mx-auto w-64 rounded-lg border p-2"
                />

              </div>

              <p className="mt-4 text-sm text-gray-500">
                Show this QR code at the event entrance.
              </p>

            </div>
          )}

        {/* ============================= */}
        {/* MY BOOKINGS */}
        {/* ============================= */}

        {token &&
          userRole === "customer" &&
          showBookings &&
          !viewedTicket &&
          !booking && (
            <div className="rounded-xl bg-white p-8 shadow-md">

              <div className="mb-6 flex items-center justify-between">

                <div>
                  <h2 className="text-3xl font-bold">
                    My Bookings
                  </h2>

                  <p className="mt-2 text-gray-600">
                    View your previous ticket bookings.
                  </p>
                </div>

                <button
                  onClick={
                    handleRefreshBookings
                  }
                  disabled={
                    bookingsLoading
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {bookingsLoading
                    ? "Refreshing..."
                    : "Refresh"}
                </button>

              </div>

              {bookingsLoading ? (
                <p className="text-gray-600">
                  Loading your bookings...
                </p>
              ) : myBookings.length ===
                0 ? (

                <div className="rounded-lg bg-gray-100 p-8 text-center">

                  <p className="text-lg text-gray-600">
                    You don't have any bookings yet.
                  </p>

                  <button
                    onClick={
                      handleBackToEvents
                    }
                    className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
                  >
                    Browse Events
                  </button>

                </div>

              ) : (

                <div className="space-y-4">

                  {myBookings.map(
                    (item) => (
                      <div
                        key={
                          item.booking_id
                        }
                        className="rounded-xl border p-5"
                      >

                        <div className="flex flex-col justify-between gap-4 md:flex-row">

                          <div>

                            <h3 className="text-xl font-bold">
                              Booking #
                              {
                                item.booking_id
                              }
                            </h3>

                            <p className="mt-2 text-gray-600">
                              Show ID:{" "}
                              {
                                item.show_id
                              }
                            </p>

                            <p className="mt-2 text-gray-600">
                              Booking Date:{" "}
                              {item.created_at
                                ? new Date(
                                    item.created_at
                                  ).toLocaleString()
                                : "N/A"}
                            </p>

                          </div>

                          <div className="md:text-right">

                            <p className="text-xl font-bold">
                              ₹
                              {
                                item.total_amount
                              }
                            </p>

                            <span className="mt-2 inline-block rounded-full bg-green-100 px-4 py-1 text-sm font-semibold text-green-700">
                              {
                                item.status
                              }
                            </span>

                          </div>

                        </div>

                        <button
                          onClick={() =>
                            handleViewTicket(
                              item
                            )
                          }
                          disabled={
                            ticketLoading
                          }
                          className="mt-5 rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:bg-gray-400"
                        >
                          {ticketLoading
                            ? "Loading Ticket..."
                            : "View Ticket"}
                        </button>

                        {item.status === "CONFIRMED" && (
                          <button
                            onClick={() =>
                              handleCancelBooking(
                                item.booking_id
                              )
                            }
                            disabled={bookingsLoading}
                            className="mt-5 ml-3 rounded-lg bg-red-100 px-5 py-2 font-semibold text-red-700 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            Cancel Booking
                          </button>
                        )}

                      </div>
                    )
                  )}

                </div>
              )}

              <button
                onClick={
                  handleBackToEvents
                }
                className="mt-8 rounded-lg bg-gray-800 px-6 py-3 font-semibold text-white hover:bg-gray-900"
              >
                ← Back to Events
              </button>

            </div>
          )}

        {/* ============================= */}
        {/* CUSTOMER EVENTS */}
        {/* ============================= */}

        {token &&
          userRole === "customer" &&
          !selectedEvent &&
          !selectedShow &&
          !booking &&
          !showBookings &&
          !viewedTicket && (
            <div>

              {/* Customer Location Selection */}
              <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold">📍 Select Location</h2>
                  <p className="mt-2 text-gray-600">
                    Choose a city to see events and shows available in that location.
                  </p>
                </div>

                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setSelectedEvent(null);
                    setSelectedShow(null);
                    setSeats([]);
                    setError("");
                  }}
                  className="w-full max-w-md rounded-lg border bg-white p-3 text-lg"
                >
                  <option value="">Select a city</option>
                  {availableLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>

                {selectedLocation && (
                  <p className="mt-3 font-semibold text-blue-700">
                    Showing events available in {selectedLocation}
                  </p>
                )}
              </div>

              {!selectedLocation ? (
                <div className="rounded-xl bg-white p-8 text-center shadow-md">
                  <p className="text-lg text-gray-600">
                    Please select a location to view available events.
                  </p>
                </div>
              ) : locationFilteredEvents.length === 0 ? (
                <div className="rounded-xl bg-white p-8 text-center shadow-md">
                  <p className="text-lg text-gray-600">
                    No events are currently available in {selectedLocation}.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                  {locationFilteredEvents.map((event) => (
                    <div
                      key={event.event_id}
                      className="rounded-xl bg-white p-6 shadow-md"
                    >

                      <h2 className="text-2xl font-semibold">
                        {event.name}
                      </h2>

                      <p className="mt-2 text-blue-600">
                        {event.category}
                      </p>

                      <p className="mt-4 text-gray-600">
                        {event.description}
                      </p>

                      <p className="mt-4 text-sm font-semibold text-green-700">
                        📍 {selectedLocation}
                      </p>

                      <button
                        onClick={() =>
                          handleViewEvent(event.event_id)
                        }
                        className="mt-6 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
                      >
                        View Shows
                      </button>

                    </div>
                  ))}

                </div>
              )}

            </div>
          )}

        {/* ============================= */}
        {/* EVENT DETAILS */}
        {/* ============================= */}

        {token &&
          userRole === "customer" &&
          selectedEvent &&
          !selectedShow &&
          !booking && (
            <div className="max-w-2xl rounded-xl bg-white p-8 shadow-md">

              <button
                onClick={() =>
                  setSelectedEvent(
                    null
                  )
                }
                className="mb-6 text-blue-600"
              >
                ← Back to Events
              </button>

              <h2 className="text-3xl font-bold">
                {selectedEvent.name}
              </h2>

              <p className="mt-2 text-blue-600">
                {
                  selectedEvent.category
                }
              </p>

              <p className="mt-4 text-gray-600">
                {
                  selectedEvent.description
                }
              </p>

              <div className="mt-5 rounded-lg bg-blue-50 p-4">
                <p className="font-semibold text-blue-800">
                  📍 Location: {selectedLocation}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Showing only shows available in the selected location.
                </p>
              </div>

              <h3 className="mt-8 text-xl font-semibold">
                Available Shows
              </h3>

              {selectedEvent.shows
                .filter(
                  (show) =>
                    !isShowCompleted(show) &&
                    show.city &&
                    selectedLocation &&
                    show.city.toLowerCase() ===
                      selectedLocation.toLowerCase()
                )
                .map(
                  (show) => (
                    <div
                    key={
                      show.show_id
                    }
                    className="mt-4 rounded-lg border p-4"
                  >

                    <p>
                      <strong>
                        Date:
                      </strong>{" "}
                      {
                        show.show_date
                      }
                    </p>

                    <p>
                      <strong>
                        Time:
                      </strong>{" "}
                      {
                        show.show_time
                      }
                    </p>

                    <p>
                      <strong>
                        Venue:
                      </strong>{" "}
                      {
                        show.venue_name
                      }
                    </p>

                    <p className="mt-2 text-green-700">
                      <strong>
                        Ticket Price:
                      </strong>{" "}
                      ₹{Number(show.price || 0).toFixed(2)}
                    </p>

                    <button
                      onClick={() =>
                        handleSelectShow(
                          show
                        )
                      }
                      className="mt-4 rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700"
                    >
                      Select Seats
                    </button>

                  </div>
                )
              )}

              {selectedEvent.shows.filter(
                (show) =>
                  !isShowCompleted(show) &&
                  show.city &&
                  selectedLocation &&
                  show.city.toLowerCase() ===
                    selectedLocation.toLowerCase()
              ).length === 0 && (
                <p className="mt-5 rounded-lg bg-gray-100 p-4 text-gray-600">
                  No upcoming shows are currently available for this event in {selectedLocation}.
                </p>
              )}

            </div>
          )}

        {/* ============================= */}
        {/* SEAT SELECTION */}
        {/* ============================= */}

        {token &&
          userRole === "customer" &&
          selectedShow &&
          !booking && (
            <div className="rounded-xl bg-white p-8 shadow-md">

              <button
                onClick={
                  handleBackToShow
                }
                className="mb-6 text-blue-600"
              >
                ← Back to Show
              </button>

              <h2 className="mb-2 text-2xl font-bold">
                Select Your Seats
              </h2>

              <p className="mb-8 text-gray-600">
                {selectedEvent.name} ·{" "}
                {
                  selectedShow.venue_name
                }
              </p>

              <div className="mx-auto max-w-xl">

                <div className="mb-8 rounded-lg bg-gray-800 py-3 text-center text-white">
                  SCREEN
                </div>

                {/* Seat Legend */}
                <div className="mb-6 flex flex-wrap justify-center gap-4 text-sm">

                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded bg-green-500"></span>
                    Available
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded bg-blue-600"></span>
                    Selected
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded bg-yellow-500"></span>
                    Locked
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded bg-red-500"></span>
                    Confirmed
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded bg-gray-500"></span>
                    Blocked
                  </div>

                </div>

                {/* Seats */}
                <div className="grid grid-cols-5 gap-4">

                  {[...seats]
                    .sort(
                      (a, b) => {
                        if (
                          a.row !==
                          b.row
                        ) {
                          return a.row.localeCompare(
                            b.row
                          );
                        }

                        return (
                          a.number -
                          b.number
                        );
                      }
                    )
                    .map(
                      (seat) => (
                        <button
                          key={
                            seat.show_seat_id
                          }
                          onClick={() =>
                            toggleSeat(
                              seat
                            )
                          }
                          disabled={
                            seat.status !==
                              "AVAILABLE" ||
                            processing
                          }
                          className={`rounded-lg px-3 py-3 font-semibold ${
                            seat.status ===
                            "CONFIRMED"
                              ? "cursor-not-allowed bg-red-500 text-white"
                              : seat.status ===
                                "BLOCKED"
                              ? "cursor-not-allowed bg-gray-500 text-white"
                              : seat.status ===
                                "LOCKED"
                              ? "cursor-not-allowed bg-yellow-500 text-white"
                              : seat.selected
                              ? "bg-blue-600 text-white"
                              : "bg-green-500 text-white hover:bg-green-600"
                          }`}
                        >
                          {
                            seat.row
                          }
                          {
                            seat.number
                          }
                        </button>
                      )
                    )}

                </div>

                {/* Selected Seats */}
                <div className="mt-8 rounded-lg bg-gray-100 p-4">

                  <h3 className="font-semibold">
                    Selected Seats
                  </h3>

                  {seats.filter(
                    (seat) =>
                      seat.selected
                  ).length === 0 ? (

                    <p className="mt-2 text-gray-500">
                      No seats selected
                    </p>

                  ) : (

                    <p className="mt-2 text-blue-600">
                      {seats
                        .filter(
                          (seat) =>
                            seat.selected
                        )
                        .map(
                          (seat) =>
                            `${seat.row}${seat.number}`
                        )
                        .join(
                          ", "
                        )}
                    </p>

                  )}

                </div>

                {/* Total */}
                <div className="mt-4 text-right text-lg font-bold">
                  Total: ₹
                  {seats
                    .filter((seat) => seat.selected)
                    .reduce(
                      (total, seat) =>
                        total + Number(seat.price || 0),
                      0
                    )}
                </div>

                {/* Lock */}
                <button
                  onClick={
                    handleLockSeats
                  }
                  disabled={
                    processing ||
                    seatsLocked
                  }
                  className="mt-8 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {seatsLocked
                    ? "Seats Locked"
                    : processing
                    ? "Locking Seats..."
                    : "Lock Selected Seats"}
                </button>

                {/* Payment */}
                {seatsLocked &&
                  !booking && (
                    <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-5">

                      <h3 className="text-lg font-bold">
                        Seats Locked Successfully
                      </h3>

                      <p className="mt-2 text-gray-600">
                        Your selected seats are reserved for 5 minutes.
                      </p>

                      <button
                        onClick={
                          handlePayment
                        }
                        disabled={
                          processing
                        }
                        className="mt-4 w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                      >
                        {processing
                          ? "Processing Payment..."
                          : "Proceed to Payment"}
                      </button>

                    </div>
                  )}

              </div>

            </div>
          )}

        {/* ============================= */}
        {/* BOOKING CONFIRMATION */}
        {/* ============================= */}

        {token &&
          userRole === "customer" &&
          booking &&
          payment &&
          ticketQR && (
            <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-md">

              <div className="mb-4 text-5xl">
                ✅
              </div>

              <h2 className="text-3xl font-bold text-green-600">
                Booking Confirmed!
              </h2>

              <p className="mt-3 text-gray-600">
                Your ticket has been successfully booked.
              </p>

              <div className="mt-6 rounded-lg bg-gray-100 p-5 text-left">

                <p>
                  <strong>
                    Booking ID:
                  </strong>{" "}
                  {
                    booking.booking_id
                  }
                </p>

                <p className="mt-2">
                  <strong>
                    Payment:
                  </strong>{" "}
                  {
                    payment.status ||
                    "SUCCESS"
                  }
                </p>

                <p className="mt-2">
                  <strong>
                    Amount:
                  </strong>{" "}
                  ₹
                  {
                    booking.total_amount ??
                    booking.total ??
                    booking.amount ??
                    "N/A"
                  }
                </p>

              </div>

              <div className="mt-6">

                <h3 className="mb-3 text-xl font-semibold">
                  Your Ticket QR
                </h3>

                <img
                  src={ticketQR}
                  alt="Ticket QR Code"
                  className="mx-auto w-64 rounded-lg border p-2"
                />

              </div>

              <button
                onClick={
                  handleBackToEvents
                }
                className="mt-8 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Back to Events
              </button>

            </div>
          )}

      </div>
    </div>
  );
}

export default App;