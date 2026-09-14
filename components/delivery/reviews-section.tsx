"use client"

import { Star } from "lucide-react"
import { reviews } from "@/lib/data"

export function ReviewsSection() {
  return (
    <section className="bg-card border-t border-border py-6">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((star, index) => (
                <Star 
                  key={star} 
                  className="w-5 h-5 fill-yellow-400 text-yellow-400 animate-in zoom-in duration-300 fill-mode-both" 
                  style={{ animationDelay: `${index * 100}ms` }}
                />
              ))}
            </div>
            <p className="text-3xl font-bold text-foreground animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500 fill-mode-both">4.8</p>
            <p className="text-sm text-muted-foreground">478 avaliações nos últimos 90 dias</p>
            <p className="text-xs text-muted-foreground">1360+ avaliações no total</p>
          </div>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              style={{ animationDelay: `${600 + index * 100}ms` }}
              className="flex-shrink-0 w-64 bg-secondary rounded-lg p-4 
                animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both
                hover:bg-secondary/80 hover:scale-[1.02] hover:shadow-md
                transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {review.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{review.name}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{review.comment}</p>
              <p className="text-xs text-muted-foreground mt-2">{review.date}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
