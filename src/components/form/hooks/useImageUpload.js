import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function useImageUpload(session, toast, setFormData) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: "L'image ne doit pas dépasser 5MB.",
          variant: 'destructive',
        });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: 'Format de fichier non supporté',
          description: 'Veuillez choisir une image JPEG, PNG, ou WEBP.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      if (typeof setFormData === 'function') {
        setFormData((prev) => ({ ...prev, image_url: '' }));
      }
    }
  };

  const uploadImage = async () => {
    if (!selectedFile || !session?.user) return null;
    setIsUploadingImage(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(data.path);

      setIsUploadingImage(false);
      toast({
        title: 'Image téléversée',
        description: 'Votre image a été ajoutée à la recette.',
      });
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erreur de téléversement',
        description: error.message,
        variant: 'destructive',
      });
      setIsUploadingImage(false);
      return null;
    }
  };

  return {
    fileInputRef,
    handleFileChange,
    uploadImage,
    selectedFile,
    previewImage,
    isUploadingImage,
    setPreviewImage,
    setSelectedFile,
  };
}
