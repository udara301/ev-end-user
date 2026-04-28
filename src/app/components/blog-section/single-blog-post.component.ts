
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-single-blog-post',
  templateUrl: './single-blog-post.component.html',
  imports: [CommonModule],
  standalone: true,
  styleUrls: ['./single-blog-post.component.scss']
})
export class SingleBlogPostComponent {
  blogId: string | null = null;
  post: any = null;

  posts = [
    {
      id: '1',
      tag: 'Travel route',
      title: 'The ultimate Galle to Ella EV road trip guide',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQieXWMznSJnyDzLOS3ftJ1Gk1PAR7fhF1S7g&s',
      content: `Discover the best charging stops and scenic lookouts on Sri Lanka's most beautiful road trip. Here is the full content for the Galle to Ella EV road trip guide. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eu consectetur consectetur, nisl nisi consectetur nisi, eu consectetur nisl nisi euismod nisi.`
    },
    {
      id: '2',
      tag: 'Partner story',
      title: `How Chamari's guesthouse doubled revenue`,
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSf41RADkqKuglMfzC41ceRFnsoAPVbBju6nA&s',
      content: `A look at how a simple EV charger installation changed the trajectory of a small business. Here is the full story of Chamari's guesthouse. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eu consectetur consectetur, nisl nisi consectetur nisi, eu consectetur nisl nisi euismod nisi.`
    }
  ];

  constructor(private route: ActivatedRoute) {
    this.blogId = this.route.snapshot.paramMap.get('id');
    this.post = this.posts.find((p: any) => p.id === this.blogId);
    console.log('Loaded post:', this.post);
  }
}
