import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Required for static export
export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  try {
    const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
    const projectsData = fs.readFileSync(projectsPath, 'utf8');
    const projects = JSON.parse(projectsData);

    return NextResponse.json(projects, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300, s-maxage=300' // 5 minute cache
      }
    });
  } catch (error) {
    console.error('Error reading projects.json:', error);
    return NextResponse.json(
      { error: 'Failed to load projects data' },
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
