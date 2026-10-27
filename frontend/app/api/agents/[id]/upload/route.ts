import axiosClient from "@/lib/axios";
import { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const formData = await request.formData();
    const { id } = await params;
    const file = formData.get('file') as File | null
    //console.log('file----', file)
    if (!file) {
      return NextResponse.json(
        { message: 'File is required.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)


    const forwardFormData = new FormData()
    forwardFormData.append("file", buffer, {
      filename: file.name,
      contentType: file.type,
    })

    const { data } = await axiosClient.post(
      `/api/agents/${id}/upload`,
      forwardFormData,
      {
        headers: forwardFormData.getHeaders()
      }
    )

    return NextResponse.json(
      data,
      { status: 200 }
    )
  } catch (err) {
    console.error('agents id get', err);
    if (err instanceof AxiosError) {
      return NextResponse.json(
        err.response?.data || { 'message': 'Something went wrong.' },
        {
          status: err.response?.status
        }
      )
    }

    return new NextResponse('Something went wrong.', { status: 500 })
  }
}