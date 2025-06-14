import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import { AppContext } from "../../context/AppContext";
import NavigationButtons from "../../components/NavigationButtons";

// ... existing code ...

return (
  <Container maxWidth="lg" sx={{ mt: 4 }}>
    <NavigationButtons
      backPath="/dashboard"
      forwardPath="/educator/create-course"
      backText="العودة للوحة التحكم"
      forwardText="إنشاء كورس جديد"
      showHome={true}
    />

    {loading ? (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    ) : error ? (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    ) : (
      <Grid container spacing={4}>
        {courses.map((course) => (
          // ... existing course card code ...
        ))}
      </Grid>
    )}
  </Container>
);
// ... existing code ... 