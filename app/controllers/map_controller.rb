require 'open3'
class MapController < ApplicationController
  caches_page :find
  protect_from_forgery :except => :formats

  def index
    redirect_to "http://mapknitter.org"
  end

  def edit
    redirect_to "http://mapknitter.org/maps/edit/"+params[:id]
  end

  def images
    redirect_to "http://mapknitter.org"
  end

  def cache
    keys = params[:id].split(',')
    keys.each do |key|
      system('cd '+RAILS_ROOT+'/public/api/0.6/geohash && wget '+key+'.json')
    end
  end

  def clear_cache
      system('rm '+RAILS_ROOT+'/public/api/0.6/geohash/*.json')
  end

  def update_map
    redirect_to "http://mapknitter.org"
  end

  def create
    redirect_to "http://mapknitter.org"
  end
 
  def login
  end

  def show
    redirect_to "http://mapknitter.org/maps/"+params[:id]
  end

  def search
    redirect_to "http://mapknitter.org/maps/"+params[:id]
  end
 
  def update
  end

  def geolocate
    begin
	@location = GeoKit::GeoLoc.geocode(params[:q])
	render :layout => false
    rescue
	render :text => "No results"
    end
  end
 
  # displays a map for the place name in the URL: "cartagen.org/find/cambridge, MA"
  def find
    # determine range, or use default:
    if params[:range]
      range = params[:range].to_f
    end
    range ||= 0.001

    # use lat/lon or geocode a string:
    if params[:lat] && params[:lon]
      geo = GeoKit::GeoLoc.new
      geo.lat = params[:lat]
      geo.lng = params[:lon]
      geo.success = true
    else
      unless params[:id]
        params[:id] = "20 ames st cambridge"
      end
      cache = "geocode"+params[:id]
      geo = Rails.cache.read(cache)
      unless geo
        geo = GeoKit::GeoLoc.geocode(params[:id])
        Rails.cache.write(cache,geo)
      end
    end
    if params[:zoom_level]
      zoom_level = params[:zoom_level]
    else
      zoom_level = Openstreetmap.precision(geo)
    end
    if geo.success
      # use geo.precision to define a width and height for the viewport
      # set zoom_x and zoom_y accordingly in javascript... and the scale factor.
      @map = {:range => range, :zoom_level => zoom_level,:lat => geo.lat, :lng => geo.lng}
      render :layout => false
    end
  end
  
  # accepts lat1,lng1,lat2,lng2 and returns osm features for the bounding box in various formats
  def plot
    cache = "bbox="+params[:lng1]+","+params[:lat1]+","+params[:lng2]+","+params[:lat2]
    if params[:live] == true
      @features = Rails.cache.read(cache)
    end
    unless @features
      @features = Openstreetmap.features(params[:lng1],params[:lat1],params[:lng2],params[:lat2])
      Rails.cache.write(cache,@features)
    end
    respond_to do |format|
      format.html { render :html => @features, :layout => false }
      format.xml  { render :xml => @features, :layout => false }
      format.kml  { render :template => "map/plot.kml.erb", :layout => false }
      format.js  { render :json => @features, :layout => false }
    end
  end

  # accepts lat1,lng1,lat2,lng2 and returns osm features for the bounding box in various formats
  def tag
    cache = "bbox="+params[:lng1]+","+params[:lat1]+","+params[:lng2]+","+params[:lat2]
    # if params[:live] == true
    #   @features = Rails.cache.read(cache)
    # end
    # unless @features
      @features = Xapi.tag(params[:lng1],params[:lat1],params[:lng2],params[:lat2],params[:key],params[:value])
      # Rails.cache.write(cache,@features)
    # end
    respond_to do |format|
      format.html { render :html => @features, :layout => false }
      format.xml  { render :xml => @features, :layout => false }
      format.kml  { render :template => "map/plot.kml.erb", :layout => false }
      format.js  { render :json => @features, :layout => false }
    end
  end

  def formats
    redirect_to "http://mapknitter.org"
  end

  def output
    redirect_to "http://mapknitter.org"
  end

  def layers
	render :layout => false
  end

  def cancel_export
	export = Export.find_by_map_id(params[:id])
	export.status = 'none'
	export.save
	render :text => 'cancelled'
  end

  def progress
    redirect_to "http://mapknitter.org"
  end

  def export
    redirect_to "http://mapknitter.org"
  end
end
