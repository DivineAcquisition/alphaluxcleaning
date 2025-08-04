import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGrid } from "@/components/admin/AdminGrid";
import { PlayCircle, BookOpen, Award, Clock, CheckCircle, Users, Target, TrendingUp } from "lucide-react";

export default function TrainingPortal() {
  const [selectedCourse, setSelectedCourse] = useState(null);

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
      difficulty: "Beginner"
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
      difficulty: "Intermediate"
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
      difficulty: "Advanced"
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
      difficulty: "Beginner"
    }
  ];

  const achievements = [
    { title: "Safety Champion", earned: true, icon: "🛡️" },
    { title: "Customer Favorite", earned: true, icon: "⭐" },
    { title: "Speed Expert", earned: false, icon: "⚡" },
    { title: "Quality Master", earned: false, icon: "🏆" }
  ];

  return (
    <AdminLayout 
      title="Learning Management System" 
      description="Comprehensive training and certification platform"
    >
      {/* Training Overview */}
      <AdminGrid columns="auto" gap="lg">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Courses Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">12</div>
            <p className="text-sm text-muted-foreground">Out of 16 total</p>
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
            <div className="text-3xl font-bold text-accent">5</div>
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

      {/* Course Library */}
      <Card className="bg-gradient-card border-0 shadow-soft">
        <CardHeader>
          <CardTitle>Training Courses</CardTitle>
          <CardDescription>
            Interactive video courses with quizzes and certification tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {courses.map((course) => (
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
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.modules} modules
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
                  
                  <Button variant="outline" className="ml-4">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {course.status === "Not Started" ? "Start" : "Continue"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements & Certifications */}
      <AdminGrid columns={2} gap="lg">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
            </CardTitle>
            <CardDescription>Badges earned through exceptional performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg text-center ${
                    achievement.earned 
                      ? 'bg-success/10 border border-success/20' 
                      : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <h4 className="font-semibold text-sm">{achievement.title}</h4>
                  {achievement.earned && (
                    <Badge variant="outline" className="mt-2">Earned</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Tracking
            </CardTitle>
            <CardDescription>Your learning progress and improvement areas</CardDescription>
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
    </AdminLayout>
  );
}