<Container maxWidth="md" sx={{ mt: 4, px: { xs: 2, md: 0 } }}>
  <NavigationButtons
    backPath="/educator/courses"
    forwardPath={null}
    backText="العودة للكورسات"
    showHome={true}
  />

  <Box
    component="form"
    onSubmit={handleSubmit}
    sx={{
      mt: 3,
      display: "flex",
      flexDirection: "column",
      gap: 3,
    }}
  >
    {/* مثال على حقل ريسبونسيف */}
    <TextField
      fullWidth
      label="عنوان الكورس"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />

    <TextField
      fullWidth
      label="وصف الكورس"
      multiline
      rows={4}
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />

    {/* باقي الحقول... */}

    {error && <Alert severity="error">{error}</Alert>}
    {loading && <CircularProgress sx={{ alignSelf: "center" }} />}

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
</Container>;
