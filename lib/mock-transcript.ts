export const MOCK_TRANSCRIPT = `Welcome to today's English lesson about daily routines and healthy habits. In this video, we'll explore common vocabulary and expressions that native speakers use when talking about their everyday activities.

Let's start with morning routines. Most people wake up early in the morning, usually around 6 or 7 AM. The first thing many people do is brush their teeth and wash their face. This is an essential part of personal hygiene that helps us feel fresh and ready for the day.

After getting ready, people often have breakfast. A typical breakfast might include cereal with milk, toast with butter and jam, or eggs with bacon. Some people prefer healthier options like oatmeal with fresh fruit or yogurt with granola. It's important to eat a nutritious breakfast because it gives you energy for the morning.

During the day, people engage in various activities. Students go to school or university to attend classes and learn new subjects. Working adults commute to their offices, factories, or other workplaces. The commute can be by car, bus, train, or even bicycle, depending on where you live.

At work or school, people interact with colleagues, classmates, and teachers. They participate in meetings, complete assignments, and collaborate on projects. Communication skills are crucial in these environments, whether you're giving a presentation, asking questions, or simply having casual conversations during lunch break.

Exercise and physical activity are important parts of a healthy lifestyle. Some people prefer to exercise in the morning before work, while others like to work out in the evening after finishing their daily responsibilities. Popular forms of exercise include running, swimming, cycling, and going to the gym. Regular exercise helps maintain good health and reduces stress.

In the evening, families often gather for dinner. This is a time to share stories about the day, discuss plans for tomorrow, and enjoy each other's company. After dinner, people might watch television, read books, or spend time on hobbies like painting, playing musical instruments, or gardening.

Before going to bed, it's good to establish a relaxing bedtime routine. This might include taking a warm shower, reading a few pages of a book, or listening to calm music. Getting enough sleep is essential for physical and mental health. Most adults need between 7 to 9 hours of sleep each night.

Weekend routines are often different from weekday schedules. People have more free time to pursue leisure activities, spend time with family and friends, or catch up on household chores like cleaning, laundry, and grocery shopping. Some people use weekends to explore new places, visit museums, or enjoy outdoor activities like hiking or picnicking in the park.

Remember, developing good daily habits takes time and consistency. Start with small changes and gradually build up to more comprehensive routines. The key is to find a balance between work, rest, and recreation that works for your lifestyle and personal goals.`

export const generateMockTranscript = (url: string): string => {
  // Simple mock - in a real app, this would call a YouTube API
  const videoId = extractVideoId(url)

  if (!videoId) {
    return "Invalid YouTube URL. Please provide a valid YouTube video link."
  }

  // Return the same mock transcript for any valid URL
  return MOCK_TRANSCRIPT
}

export const extractVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

export const getVideoTitle = (url: string): string => {
  const videoId = extractVideoId(url)
  if (!videoId) return "Unknown Video"

  // Mock titles based on video ID for demo
  const mockTitles = [
    "Daily Routines and Healthy Habits - English Lesson",
    "Learn English Vocabulary - Everyday Activities",
    "English Conversation Practice - Daily Life",
    "Improve Your English - Common Expressions",
    "English Learning - Morning and Evening Routines",
  ]

  // Use video ID to consistently return the same title
  const index = videoId.length % mockTitles.length
  return mockTitles[index]
}
