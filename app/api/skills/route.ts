import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Required for static export
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  try {
    const skillsPath = path.join(process.cwd(), 'data', 'skills.json');
    const skillsData = fs.readFileSync(skillsPath, 'utf8');
    const skills = JSON.parse(skillsData);

    return NextResponse.json(skills, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300, s-maxage=300' // 5 minute cache
      }
    });
  } catch (error) {
    console.error('Error reading skills.json:', error);
    return NextResponse.json(
      { error: 'Failed to load skills data' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}
