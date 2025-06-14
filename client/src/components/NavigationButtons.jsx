import React from "react";
import { Box, Button, useTheme, useMediaQuery } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HomeIcon from "@mui/icons-material/Home";

const NavigationButtons = ({
  backPath,
  forwardPath,
  backText = "رجوع",
  forwardText = "التالي",
  showHome = true,
  onBackClick,
  onForwardClick,
  disabled = false,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  const handleForward = () => {
    if (onForwardClick) {
      onForwardClick();
    } else if (forwardPath) {
      navigate(forwardPath);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        mt: 2,
        mb: 2,
        flexDirection: isMobile ? "column" : "row",
        width: "100%",
        position: "relative",
        zIndex: 1000,
        backgroundColor: "white",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        border: "1px solid rgba(0,0,0,0.1)",
      }}
    >
      <Box sx={{ display: "flex", gap: 2, width: isMobile ? "100%" : "auto" }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          fullWidth={isMobile}
          sx={{
            minWidth: "120px",
            height: "40px",
            backgroundColor: "white",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          {backText}
        </Button>
        {showHome && (
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/")}
            fullWidth={isMobile}
            sx={{
              minWidth: "120px",
              height: "40px",
              backgroundColor: "white",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            الرئيسية
          </Button>
        )}
      </Box>
      {forwardPath && (
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={handleForward}
          disabled={disabled}
          fullWidth={isMobile}
          sx={{
            minWidth: "120px",
            height: "40px",
            backgroundColor: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
            "&.Mui-disabled": {
              backgroundColor: theme.palette.action.disabledBackground,
            },
          }}
        >
          {forwardText}
        </Button>
      )}
    </Box>
  );
};

export default NavigationButtons;
