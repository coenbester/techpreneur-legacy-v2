"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, Eye, Lightbulb, Wrench, BarChart3, MessageSquare } from "lucide-react"

interface CognitiveGuidanceProps {
  cognitiveType: string
}

export default function CognitiveGuidance({ cognitiveType }: CognitiveGuidanceProps) {
  const getGuidanceData = (type: string) => {
    switch (type) {
      case "Remember":
        return {
          icon: <Brain className="h-5 w-5" />,
          color: "bg-blue-50 border-blue-200 text-blue-800",
          description:
            "Recall facts, terms, basic concepts, or answers without necessarily understanding what they mean.",
          keywords: ["Define", "List", "Identify", "Name", "State", "Describe"],
          tips: [
            "Focus on key facts and definitions from the material",
            "Use specific terminology and concepts",
            "Be precise and accurate in your recall",
            "Include relevant details and examples",
          ],
        }
      case "Understand":
        return {
          icon: <Eye className="h-5 w-5" />,
          color: "bg-green-50 border-green-200 text-green-800",
          description: "Demonstrate understanding by explaining ideas or concepts in your own words.",
          keywords: ["Explain", "Summarize", "Interpret", "Compare", "Contrast", "Classify"],
          tips: [
            "Explain concepts in your own words",
            "Show relationships between ideas",
            "Use examples to illustrate your understanding",
            "Demonstrate comprehension of main principles",
          ],
        }
      case "Apply":
        return {
          icon: <Wrench className="h-5 w-5" />,
          color: "bg-purple-50 border-purple-200 text-purple-800",
          description: "Use information in new situations or apply knowledge to solve problems.",
          keywords: ["Apply", "Demonstrate", "Use", "Solve", "Implement", "Execute"],
          tips: [
            "Show how concepts work in practice",
            "Use knowledge to solve specific problems",
            "Apply theories to real-world situations",
            "Demonstrate practical implementation",
          ],
        }
      case "Analyze":
        return {
          icon: <BarChart3 className="h-5 w-5" />,
          color: "bg-orange-50 border-orange-200 text-orange-800",
          description: "Break down information into parts and examine relationships between elements.",
          keywords: ["Analyze", "Examine", "Compare", "Contrast", "Differentiate", "Organize"],
          tips: [
            "Break down complex ideas into components",
            "Identify patterns and relationships",
            "Compare and contrast different elements",
            "Examine cause and effect relationships",
          ],
        }
      case "Evaluate":
        return {
          icon: <Lightbulb className="h-5 w-5" />,
          color: "bg-red-50 border-red-200 text-red-800",
          description: "Make judgments about information, validity of ideas, or quality of work based on criteria.",
          keywords: ["Evaluate", "Judge", "Critique", "Assess", "Justify", "Recommend"],
          tips: [
            "Make informed judgments with supporting evidence",
            "Assess strengths and weaknesses",
            "Use criteria to evaluate options",
            "Provide reasoned recommendations",
          ],
        }
      case "Reflection":
        return {
          icon: <MessageSquare className="h-5 w-5" />,
          color: "bg-indigo-50 border-indigo-200 text-indigo-800",
          description: "Think deeply about your learning, experiences, and how they connect to broader concepts.",
          keywords: ["Reflect", "Consider", "Contemplate", "Think about", "Examine", "Ponder"],
          tips: [
            "Connect learning to personal experiences",
            "Consider multiple perspectives and viewpoints",
            "Examine your own thinking and learning process",
            "Discuss implications and future applications",
            "Be thoughtful and introspective in your response",
          ],
        }
      default:
        return {
          icon: <Brain className="h-5 w-5" />,
          color: "bg-gray-50 border-gray-200 text-gray-800",
          description: "Apply your knowledge and understanding to answer this question.",
          keywords: ["Think", "Consider", "Respond"],
          tips: ["Provide a thoughtful and complete response"],
        }
    }
  }

  const guidance = getGuidanceData(cognitiveType)

  return (
    <Card className={`border ${guidance.color} mb-4`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {guidance.icon}
          {cognitiveType} Level Guidance
        </CardTitle>
        <CardDescription className="text-xs">{guidance.description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div>
          <h4 className="text-xs font-semibold mb-1">Key Action Words:</h4>
          <div className="flex flex-wrap gap-1">
            {guidance.keywords.map((keyword, index) => (
              <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold mb-1">Tips for Success:</h4>
          <ul className="text-xs space-y-1">
            {guidance.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
