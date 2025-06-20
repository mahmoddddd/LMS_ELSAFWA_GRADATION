import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import { AppContext } from "../../context/AppContext";
import NavigationButtons from "../../components/NavigationButtons";

// ... existing code ...

return (
  <Container maxWidth="md" sx={{ mt: 4 }}>
    <NavigationButtons />

    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      {/* ... existing form fields ... */}

      <NavigationButtons
        backPath={null}
        forwardPath={null}
        backText="إلغاء"
        forwardText="إنشاء الكورس"
        showHome={false}
        onBackClick={() => navigate("/educator/courses")}
        onForwardClick={handleSubmit}
        disabled={loading}
      />
    </Box>
  </Container>
);
// ... existing code ...
