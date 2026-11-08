"use client";
import Sliders from './components/Sliders'
import FeatuersProducts  from './components/FeatuersProducts'
import SliderForm from './components/SliderForm'
import Ads from './components/Ads'
import ProductAds from './components/ProductAds'
import { useState } from 'react';
export default function Homepage() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSlider, setEditingSlider] = useState(null);
  
    const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : null;
  return (
 <div className="w-full ">
 
          <div className=" relative   ">
            <SliderForm setIsFormOpen={setIsFormOpen} isFormOpen={isFormOpen} sliderData={editingSlider}/>
          <Sliders setIsFormOpen={setIsFormOpen} setEditingSlider={setEditingSlider}/>
          <hr className="h-1  my-10"></hr>
          <div className=" w-full px-5 ">
          {/* <FeatuersProducts/> */}
<Ads/>
<hr className="h-1  my-10"></hr>
<ProductAds/>
          </div>
          </div>
        </div>
  ) 

}