import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Extract user information from token
function getUserFromToken(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

// Get user profile (GET)
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        snsSettings: true
      }
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userProfile }, { status: 200 });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}

// Update SNS settings (PUT)
export async function PUT(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { snsSettings } = await request.json();

    // Upsert SNS settings (create if not exists, update if exists)
    const updatedSnsSettings = await prisma.snsSettings.upsert({
      where: {
        userId: user.userId
      },
      update: {
        platforms: snsSettings.platforms || [],
        settings: snsSettings.settings || {}
      },
      create: {
        userId: user.userId,
        platforms: snsSettings.platforms || [],
        settings: snsSettings.settings || {}
      }
    });

    // Fetch updated user information
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        snsSettings: true
      }
    });

    return NextResponse.json(
      { message: 'SNS settings updated successfully', user: updatedUser },
      { status: 200 }
    );

  } catch (error) {
    console.error('SNS settings update error:', error);
    return NextResponse.json(
      { error: 'Server error occurred' },
      { status: 500 }
    );
  }
}