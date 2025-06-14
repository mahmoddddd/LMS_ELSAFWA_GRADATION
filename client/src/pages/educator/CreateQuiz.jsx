return (
  <Box p={{ xs: 2, md: 4 }}>
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          إنشاء اختبار جديد
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="عنوان الاختبار"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="وصف الاختبار"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={4}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="المدة (بالدقائق)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم تعريف الكورس"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
              />
            </Grid>

            {/* يمكن هنا إضافة أسئلة الاختبار لاحقًا */}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "إنشاء الاختبار"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  </Box>
);
