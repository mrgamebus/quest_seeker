import React from 'react'

export type HelpSection = {
  title: string
  paragraphs: React.ReactNode[]
}

export const helpSections: HelpSection[] = [
  {
    title: 'Quest Seekers (Step-by-Step)',
    paragraphs: [],
  },

  {
    title: 'Quest Creators (Step-by-Step)',
    paragraphs: [],
  },

  {
    title: 'Pricing at a Glance',
    paragraphs: [],
  },
  {
    title: 'What to Expect',
    paragraphs: [
      <>
        So you've decided to host a Quest — here's a fuller picture of what the
        experience is like as a Quest Creator, from setting up your profile
        through to rewarding your participants.
      </>,
    ],
  },
  {
    title: 'Fundraising Tips for Non-Profits',
    paragraphs: [],
  },
  {
    title: 'Contact for Support',
    paragraphs: [],
  },
]
