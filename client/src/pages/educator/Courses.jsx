return (
  <Container maxWidth="lg" sx={{ mt: 4, px: { xs: 2, md: 0 } }}>
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
          <Grid item key={course._id} xs={12} sm={6} md={4}>
            <Card>
              {course.courseThumbnail && (
                <CardMedia
                  component="img"
                  height="140"
                  image={course.courseThumbnail}
                  alt={course.courseTitle}
                />
              )}
              <CardContent>
                <Typography gutterBottom variant="h6" component="div">
                  {course.courseTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.courseDescription}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(`/educator/courses/${course._id}`)}
                >
                  عرض التفاصيل
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    )}
  </Container>
);
