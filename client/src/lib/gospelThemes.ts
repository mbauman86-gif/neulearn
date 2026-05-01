import noahsArkImage from '@assets/generated_images/noah\'s_ark_rainbow_scene.png';
import goodShepherdImage from '@assets/generated_images/good_shepherd_meadow_scene.png';
import creationImage from '@assets/generated_images/creation_garden_paradise_scene.png';
import danielLionsImage from '@assets/generated_images/daniel_with_friendly_lions.png';

export interface GospelTheme {
  id: string;
  imageUrl: string;
  title: string;
  scripture: string;
  scriptureReference: string;
  summary: string;
  discussionPrompt: string;
  months: number[];
}

export const gospelThemes: GospelTheme[] = [
  {
    id: 'noahs-ark',
    imageUrl: noahsArkImage,
    title: "Noah's Ark",
    scripture: "I have set my rainbow in the clouds, and it will be the sign of the covenant between me and the earth.",
    scriptureReference: "Genesis 9:13",
    summary: "God asked Noah to build a big boat called an ark to save his family and animals from a great flood. After the flood, God put a beautiful rainbow in the sky as a promise that He would always take care of His creation.",
    discussionPrompt: "When you see a rainbow, what does it remind you about God's promises?",
    months: [1, 2, 3]
  },
  {
    id: 'good-shepherd',
    imageUrl: goodShepherdImage,
    title: "The Good Shepherd",
    scripture: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures.",
    scriptureReference: "Psalm 23:1-2",
    summary: "Jesus loves us like a shepherd loves his sheep. A good shepherd takes care of his sheep, keeps them safe, and makes sure they have everything they need. Jesus does the same for us!",
    discussionPrompt: "How does it feel to know that Jesus watches over you like a caring shepherd?",
    months: [4, 5, 6]
  },
  {
    id: 'creation',
    imageUrl: creationImage,
    title: "God's Beautiful Creation",
    scripture: "God saw all that he had made, and it was very good.",
    scriptureReference: "Genesis 1:31",
    summary: "In the beginning, God created everything - the sky, the land, the oceans, all the animals, and people too! He made the world beautiful and full of amazing things for us to enjoy and take care of.",
    discussionPrompt: "What is your favorite thing that God created? Why do you think He made it?",
    months: [7, 8, 9]
  },
  {
    id: 'daniel-lions',
    imageUrl: danielLionsImage,
    title: "Daniel and the Lions",
    scripture: "My God sent his angel, and he shut the mouths of the lions.",
    scriptureReference: "Daniel 6:22",
    summary: "Daniel loved God so much that he prayed every day. Some people didn't like this and put Daniel in a den full of lions. But God sent an angel to keep Daniel safe, and the lions didn't hurt him at all!",
    discussionPrompt: "Daniel was brave because he trusted God. What helps you feel brave when you're scared?",
    months: [10, 11, 12]
  }
];

export function getCurrentTheme(): GospelTheme {
  const currentMonth = new Date().getMonth() + 1;
  const theme = gospelThemes.find(t => t.months.includes(currentMonth));
  return theme || gospelThemes[0];
}

export function useCurrentTheme(): GospelTheme {
  return getCurrentTheme();
}
