import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { PlayCircle, BookOpen, Award, Clock, CheckCircle, Users, Target, TrendingUp, Video, MessageSquare, Star, Search, Filter, Calendar, Brain, Zap, FileText, Download, Upload } from "lucide-react";

export default function TrainingPortal() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState("courses");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const courses = [
    {
      id: 1,
      title: "Customer Service Excellence",
      description: "Master the art of exceptional customer interactions",
      duration: "2 hours",
      modules: 8,
      progress: 75,
      status: "In Progress",
      category: "Customer Service",
      difficulty: "Beginner",
      videoUrl: "/videos/customer-service.mp4",
      instructor: "Sarah Johnson",
      rating: 4.8,
      enrollments: 245
    },
    {
      id: 2,
      title: "Chemical Safety & Handling",
      description: "Essential safety protocols for cleaning chemicals",
      duration: "1.5 hours",
      modules: 6,
      progress: 100,
      status: "Completed",
      category: "Safety",
      difficulty: "Intermediate",
      videoUrl: "/videos/chemical-safety.mp4",
      instructor: "Dr. Mike Chen",
      rating: 4.9,
      enrollments: 189
    },
    {
      id: 3,
      title: "Advanced Cleaning Techniques",
      description: "Professional methods for superior results",
      duration: "3 hours",
      modules: 12,
      progress: 0,
      status: "Not Started",
      category: "Technical",
      difficulty: "Advanced",
      videoUrl: "/videos/advanced-techniques.mp4",
      instructor: "Maria Rodriguez",
      rating: 4.7,
      enrollments: 156
    },
    {
      id: 4,
      title: "Digital Tools & Mobile App",
      description: "Maximize efficiency with technology",
      duration: "1 hour",
      modules: 4,
      progress: 50,
      status: "In Progress",
      category: "Technology",
      difficulty: "Beginner",
      videoUrl: "/videos/digital-tools.mp4",
      instructor: "Alex Park",
      rating: 4.6,
      enrollments: 203
    },
    {
      id: 5,
      title: "Green Cleaning Certification",
      description: "Eco-friendly practices and sustainable methods",
      duration: "2.5 hours",
      modules: 10,
      progress: 0,
      status: "Not Started",
      category: "Environmental",
      difficulty: "Intermediate",
      videoUrl: "/videos/green-cleaning.mp4",
      instructor: "Emma Green",
      rating: 4.8,
      enrollments: 178
    }
  ];

  const certifications = [
    { name: "Safety Excellence", progress: 100, expiryDate: "2024-12-01", status: "Active" },
    { name: "Customer Service Pro", progress: 100, expiryDate: "2024-11-15", status: "Active" },
    { name: "Advanced Techniques", progress: 75, expiryDate: "2024-10-30", status: "In Progress" },
    { name: "Digital Proficiency", progress: 50, expiryDate: "2024-09-20", status: "In Progress" }
  ];

  const learningPaths = [
    {
      name: "New Hire Onboarding",
      courses: 6,
      duration: "12 hours",
      completion: 83,
      description: "Complete training pathway for new team members"
    },
    {
      name: "Safety Specialist Track",
      courses: 4,
      duration: "8 hours", 
      completion: 100,
      description: "Specialized safety training and certification"
    },
    {
      name: "Leadership Development",
      courses: 8,
      duration: "16 hours",
      completion: 25,
      description: "Management and leadership skills for supervisors"
    }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "Customer Service", "Safety", "Technical", "Technology", "Environmental"];

  const achievements = [
    { title: "Safety Champion", earned: true, icon: "🛡️" },
    { title: "Customer Favorite", earned: true, icon: "⭐" },
    { title: "Speed Expert", earned: false, icon: "⚡" },
    { title: "Quality Master", earned: false, icon: "🏆" }
  ];

  return (
    <AdminLayout 
      title="Learning Management System" 
      description="Comprehensive training platform with AI-powered personalization"
    >
      {/* Training Statistics */}
      <AdminGrid columns="auto" gap="lg">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Courses Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {courses.filter(c => c.status === "Completed").length}
            </div>
            <p className="text-sm text-muted-foreground">Out of {courses.length} available</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-success" />
              Learning Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">28.5</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {certifications.filter(c => c.status === "Active").length}
            </div>
            <p className="text-sm text-muted-foreground">Active certificates</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-warning" />
              Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">94%</div>
            <p className="text-sm text-muted-foreground">Training average</p>
          </CardContent>
        </Card>
      </AdminGrid>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="content">Content Library</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">

          {/* Search and Filters */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-background"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Course Library */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Interactive Training Courses
              </CardTitle>
              <CardDescription>
                AI-powered personalized learning with video content, quizzes, and real-time progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{course.title}</h4>
                          <Badge variant="outline">{course.category}</Badge>
                          <Badge 
                            variant={course.difficulty === "Beginner" ? "secondary" : 
                                    course.difficulty === "Intermediate" ? "default" : "destructive"}
                          >
                            {course.difficulty}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{course.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Instructor: {course.instructor} • {course.enrollments} enrolled
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {course.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {course.modules} modules
                          </span>
                          <span className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            HD Video
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Progress value={course.progress} className="flex-1" />
                          <span className="text-sm font-medium">{course.progress}%</span>
                          <Badge 
                            variant={course.status === "Completed" ? "default" : 
                                    course.status === "In Progress" ? "secondary" : "outline"}
                            className="flex items-center gap-1"
                          >
                            {course.status === "Completed" && <CheckCircle className="h-3 w-3" />}
                            {course.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="ml-4 space-y-2">
                        <Button variant="outline" className="w-full">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          {course.status === "Not Started" ? "Start Course" : "Continue Learning"}
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Video className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Discuss
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Materials
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          {/* Learning Paths */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Structured Learning Paths
              </CardTitle>
              <CardDescription>Curated course sequences for skill development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {learningPaths.map((path, i) => (
                  <div key={i} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{path.name}</h4>
                        <p className="text-sm text-muted-foreground">{path.description}</p>
                      </div>
                      <Badge variant={path.completion === 100 ? "default" : "secondary"}>
                        {path.completion}% Complete
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>{path.courses} courses</span>
                      <span>{path.duration} total</span>
                    </div>
                    <Progress value={path.completion} className="mb-3" />
                    <Button variant="outline" size="sm">
                      {path.completion === 0 ? "Start Path" : "Continue Learning"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
          {/* Certification Management */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Professional Certifications
              </CardTitle>
              <CardDescription>Track certification progress and renewal dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {certifications.map((cert, i) => (
                  <div key={i} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{cert.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Expires: {cert.expiryDate}
                        </p>
                      </div>
                      <Badge variant={cert.status === "Active" ? "default" : "secondary"}>
                        {cert.status}
                      </Badge>
                    </div>
                    <Progress value={cert.progress} className="mb-3" />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificate
                      </Button>
                      {cert.progress < 100 && (
                        <Button variant="ghost" size="sm">
                          Continue Requirements
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">

          {/* Learning Analytics */}
          <AdminGrid columns={2} gap="lg">
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Learning Intelligence
                </CardTitle>
                <CardDescription>AI-powered insights into your learning patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm">Optimal Learning Time</h4>
                    <p className="text-lg font-bold text-primary">2:00 - 4:00 PM</p>
                    <p className="text-xs text-muted-foreground">Based on your activity patterns</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h4 className="font-medium text-sm">Recommended Next Course</h4>
                    <p className="text-lg font-bold text-success">Green Cleaning Certification</p>
                    <p className="text-xs text-muted-foreground">Matches your interests and career path</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Skill Development
                </CardTitle>
                <CardDescription>Track your competency growth across key areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Customer Service</span>
                      <span>95%</span>
                    </div>
                    <Progress value={95} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Safety Compliance</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Technical Skills</span>
                      <span>87%</span>
                    </div>
                    <Progress value={87} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Communication</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AdminGrid>

          {/* Achievements */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievement System
              </CardTitle>
              <CardDescription>Gamified badges and recognition for exceptional performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg text-center transition-all hover:scale-105 ${
                      achievement.earned 
                        ? 'bg-success/10 border border-success/20' 
                        : 'bg-muted/50 opacity-60'
                    }`}
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <h4 className="font-semibold text-sm">{achievement.title}</h4>
                    {achievement.earned && (
                      <Badge variant="outline" className="mt-2">Earned</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Content Library */}
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Management
              </CardTitle>
              <CardDescription>Manage training materials and resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Content
                </Button>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Training
                </Button>
                <Button variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-Generate Quiz
                </Button>
              </div>

              <div className="grid gap-4">
                {[
                  { name: "Training Manual.pdf", type: "PDF", size: "2.4 MB", downloads: 245 },
                  { name: "Safety Checklist.docx", type: "Document", size: "156 KB", downloads: 189 },
                  { name: "Chemical Guide Video.mp4", type: "Video", size: "45.2 MB", downloads: 156 },
                  { name: "Equipment Setup.pptx", type: "Presentation", size: "3.7 MB", downloads: 203 }
                ].map((file, i) => (
                  <div key={i} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{file.name}</h4>
                          <p className="text-sm text-muted-foreground">{file.type} • {file.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{file.downloads} downloads</span>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}